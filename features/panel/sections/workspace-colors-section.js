const vscode = require("vscode");

const {
  exists,
  ensureDirectory,
  readText,
  writeText,
  joinPath
} = require("../../../shared/fs-utils");

const SECTION_ID = "workspaceColors";
const DEFAULT_COLOR = "#007ACC";

const COLOR_KEYS = [
  "activityBar.background",
  "activityBar.foreground",
  "activityBarBadge.background",
  "activityBarBadge.foreground",

  "titleBar.activeBackground",
  "titleBar.activeForeground",
  "titleBar.inactiveBackground",
  "titleBar.inactiveForeground",

  "statusBar.background",
  "statusBar.foreground",
  "statusBar.noFolderBackground",
  "statusBar.debuggingBackground"
];

const workspaceColorsSection = {
  id: SECTION_ID,

  getHtml() {
    return `
<section class="pt-section" id="workspaceColorsSection">
  <div class="pt-section-header">
    <h3 class="pt-section-title">Workspace Color</h3>

    <div class="pt-section-actions">
      <label class="pt-toggle" title="Turn workspace color on or off">
        <input id="workspaceColorToggle" type="checkbox" />
        <span class="pt-toggle-slider"></span>
      </label>

      <button
        id="workspaceColorCollapseButton"
        class="pt-collapse-button"
        type="button"
        aria-expanded="false"
        title="Expand or collapse Workspace Color"
      >
        <span class="pt-collapse-icon">▶</span>
      </button>
    </div>
  </div>

  <div id="workspaceColorContent" class="pt-section-content pt-hidden">
    <p class="pt-description">
      Apply one workspace color to the Activity Bar, Title Bar, and Status Bar.
    </p>

    <label class="pt-label" for="workspaceColorInput">Color</label>
    <input id="workspaceColorInput" class="workspace-color-input" type="color" value="${DEFAULT_COLOR}" />

    <button id="applyWorkspaceColorButton" class="pt-button">Apply Color</button>
  </div>

  <div id="workspaceColorStatus" class="pt-status"></div>
</section>`;
  },

  getCss() {
    return `
.workspace-color-input {
  width: 100%;
  height: 42px;
  padding: 2px;
  border: 1px solid var(--vscode-input-border);
  background: var(--vscode-input-background);
  cursor: pointer;
}`;
  },

  getScript() {
    return `
(function () {
  const section = "${SECTION_ID}";

  const toggle = document.getElementById("workspaceColorToggle");
  const collapseButton = document.getElementById("workspaceColorCollapseButton");
  const content = document.getElementById("workspaceColorContent");
  const colorInput = document.getElementById("workspaceColorInput");
  const status = document.getElementById("workspaceColorStatus");
  const applyButton = document.getElementById("applyWorkspaceColorButton");

  let currentState = {
    hasWorkspace: false,
    enabled: false,
    color: "${DEFAULT_COLOR}"
  };

  let controller;

  controller = createPanelSectionController({
    section,
    toggle,
    collapseButton,
    content,
    defaultEnabled: false,
    defaultExpanded: false,
    persistEnabled: false,
    onToggle(nextEnabled) {
      if (nextEnabled) {
        controller.setExpanded(true);

        postSectionMessage(section, "enable", {
          color: colorInput.value
        });

        return;
      }

      postSectionMessage(section, "disable", {});
    }
  });

  applyButton.addEventListener("click", () => {
    postSectionMessage(section, "apply", {
      color: colorInput.value
    });
  });

  listenSectionState(section, state => {
    currentState = state || currentState;

    colorInput.value = currentState.color || "${DEFAULT_COLOR}";

    controller.setEnabled(!!currentState.enabled);
    setToggleDisabled(toggle, !currentState.hasWorkspace);

    status.textContent = currentState.hasWorkspace
      ? ""
      : "Open a workspace to use workspace colors.";
  });

  window.addEventListener("projectToolkit.panelError", event => {
    status.textContent = event.detail.message || "Something went wrong.";
  });
})();`;
  },

  async getState(panelContext) {
    return getWorkspaceColorState(panelContext);
  },

  async handleMessage({ command, payload, context }) {
    switch (command) {
      case "enable": {
        const state = await enableWorkspaceColor(context, payload.color);

        return {
          state,
          info: "Workspace color turned on."
        };
      }

      case "disable": {
        const state = await disableWorkspaceColor(context);

        return {
          state,
          info: "Workspace color turned off."
        };
      }

      case "apply": {
        const state = await enableWorkspaceColor(context, payload.color);

        return {
          state,
          info: "Workspace color applied."
        };
      }

      default:
        throw new Error(`Unknown Workspace Colors command: ${command}`);
    }
  },

  async autoRun({ workspaceFolder }) {
    await autoApplyWorkspaceColor(workspaceFolder);
  }
};

async function getWorkspaceColorState(panelContext) {
  const workspaceFolder = panelContext.getWorkspaceFolder();

  if (!workspaceFolder) {
    return {
      hasWorkspace: false,
      enabled: false,
      color: DEFAULT_COLOR
    };
  }

  const settings = await readSettings(workspaceFolder);

  if (settings.enabled && settings.color) {
    await autoApplyWorkspaceColor(workspaceFolder);
  }

  return {
    hasWorkspace: true,
    enabled: !!settings.enabled,
    color: settings.color || DEFAULT_COLOR
  };
}

async function autoApplyWorkspaceColor(workspaceFolder) {
  if (!workspaceFolder) {
    return;
  }

  const settings = await readSettings(workspaceFolder);

  if (!settings.enabled) {
    return;
  }

  const normalizedColor = normalizeHexColor(settings.color || DEFAULT_COLOR);

  if (!normalizedColor) {
    return;
  }

  await createBackupIfNeeded(workspaceFolder);
  await applyColorToVSCode(workspaceFolder, normalizedColor);
}

async function enableWorkspaceColor(panelContext, color) {
  const workspaceFolder = panelContext.getWorkspaceFolder();

  if (!workspaceFolder) {
    throw new Error("Please open a workspace first.");
  }

  const normalizedColor = normalizeHexColor(color);

  if (!normalizedColor) {
    throw new Error("Please select a valid color.");
  }

  await createBackupIfNeeded(workspaceFolder);
  await applyColorToVSCode(workspaceFolder, normalizedColor);

  await writeSettings(workspaceFolder, {
    enabled: true,
    color: normalizedColor
  });

  return {
    hasWorkspace: true,
    enabled: true,
    color: normalizedColor
  };
}

async function disableWorkspaceColor(panelContext) {
  const workspaceFolder = panelContext.getWorkspaceFolder();

  if (!workspaceFolder) {
    throw new Error("Please open a workspace first.");
  }

  const settings = await readSettings(workspaceFolder);

  await restoreBackup(workspaceFolder);

  await writeSettings(workspaceFolder, {
    enabled: false,
    color: settings.color || DEFAULT_COLOR
  });

  return {
    hasWorkspace: true,
    enabled: false,
    color: settings.color || DEFAULT_COLOR
  };
}

async function applyColorToVSCode(workspaceFolder, color) {
  const config = vscode.workspace.getConfiguration("workbench", workspaceFolder.uri);
  const current = config.get("colorCustomizations") || {};

  const next = {
    ...current,
    ...buildColorCustomizations(color)
  };

  await config.update(
    "colorCustomizations",
    next,
    vscode.ConfigurationTarget.Workspace
  );
}

async function createBackupIfNeeded(workspaceFolder) {
  const backupUri = getBackupUri(workspaceFolder);

  if (await exists(backupUri)) {
    return;
  }

  const config = vscode.workspace.getConfiguration("workbench", workspaceFolder.uri);
  const current = config.get("colorCustomizations") || {};
  const generatedColors = buildColorCustomizationsFromSettingsIfActive(workspaceFolder);

  const backup = {};

  for (const key of COLOR_KEYS) {
    backup[key] = Object.prototype.hasOwnProperty.call(current, key)
      ? current[key]
      : null;
  }

  await writeJson(backupUri, backup);
}

async function restoreBackup(workspaceFolder) {
  const config = vscode.workspace.getConfiguration("workbench", workspaceFolder.uri);
  const current = config.get("colorCustomizations") || {};
  const backup = await readBackup(workspaceFolder);

  const next = {
    ...current
  };

  for (const key of COLOR_KEYS) {
    if (backup[key]) {
      next[key] = backup[key];
    } else {
      delete next[key];
    }
  }

  await config.update(
    "colorCustomizations",
    next,
    vscode.ConfigurationTarget.Workspace
  );
}

function buildColorCustomizations(color) {
  const foreground = getReadableTextColor(color);
  const darker = adjustHexColor(color, -28);
  const lighter = adjustHexColor(color, 36);

  return {
    "activityBar.background": color,
    "activityBar.foreground": foreground,
    "activityBarBadge.background": lighter,
    "activityBarBadge.foreground": getReadableTextColor(lighter),

    "titleBar.activeBackground": darker,
    "titleBar.activeForeground": foreground,
    "titleBar.inactiveBackground": color,
    "titleBar.inactiveForeground": foreground,

    "statusBar.background": darker,
    "statusBar.foreground": foreground,
    "statusBar.noFolderBackground": darker,
    "statusBar.debuggingBackground": darker
  };
}

function buildColorCustomizationsFromSettingsIfActive() {
  return {};
}

async function readSettings(workspaceFolder) {
  const uri = getSettingsUri(workspaceFolder);

  if (!(await exists(uri))) {
    return {
      enabled: false,
      color: DEFAULT_COLOR
    };
  }

  try {
    const parsed = JSON.parse(await readText(uri));

    return {
      enabled: !!parsed.enabled,
      color: parsed.color || DEFAULT_COLOR
    };
  } catch {
    return {
      enabled: false,
      color: DEFAULT_COLOR
    };
  }
}

async function writeSettings(workspaceFolder, settings) {
  await writeJson(getSettingsUri(workspaceFolder), settings);
}

async function readBackup(workspaceFolder) {
  const uri = getBackupUri(workspaceFolder);

  if (!(await exists(uri))) {
    return {};
  }

  try {
    return JSON.parse(await readText(uri));
  } catch {
    return {};
  }
}

async function writeJson(uri, value) {
  const folderUri = vscode.Uri.joinPath(uri, "..");

  await ensureDirectory(folderUri);
  await writeText(uri, `${JSON.stringify(value, null, 2)}\n`);
}

function getSettingsUri(workspaceFolder) {
  return joinPath(
    workspaceFolder.uri,
    ".vscode",
    "Project Toolkit",
    "Workspace Colors",
    "settings.json"
  );
}

function getBackupUri(workspaceFolder) {
  return joinPath(
    workspaceFolder.uri,
    ".vscode",
    "Project Toolkit",
    "Workspace Colors",
    ".backup.json"
  );
}

function normalizeHexColor(value) {
  const text = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(text)) {
    return text.toUpperCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(text)) {
    return `#${text.toUpperCase()}`;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(text)) {
    const r = text[1];
    const g = text[2];
    const b = text[3];

    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return "";
}

function adjustHexColor(hex, amount) {
  const normalized = normalizeHexColor(hex);

  if (!normalized) {
    return DEFAULT_COLOR;
  }

  const r = clamp(parseInt(normalized.slice(1, 3), 16) + amount);
  const g = clamp(parseInt(normalized.slice(3, 5), 16) + amount);
  const b = clamp(parseInt(normalized.slice(5, 7), 16) + amount);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getReadableTextColor(hex) {
  const normalized = normalizeHexColor(hex);

  if (!normalized) {
    return "#FFFFFF";
  }

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? "#000000" : "#FFFFFF";
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function toHex(value) {
  return clamp(value).toString(16).padStart(2, "0").toUpperCase();
}

module.exports = {
  workspaceColorsSection
};