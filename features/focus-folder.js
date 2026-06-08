const vscode = require("vscode");

const {
  isDirectory,
  readDirectory,
  joinPath,
  normalizePath
} = require("../shared/fs-utils");

const STORAGE_KEY = "projectToolkit.focusFolder.backup";
const CONTEXT_KEY = "projectToolkit.focusFolder.active";

let statusBarItem;

function registerFocusFolderFeature(context) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  statusBarItem.text = "$(eye-closed) Exit Focus";
  statusBarItem.tooltip = "Exit Focus Folder mode";
  statusBarItem.command = "projectToolkit.exitFocusFolder";

  context.subscriptions.push(statusBarItem);

  const focusCommand = vscode.commands.registerCommand(
    "projectToolkit.focusFolder",
    async (uri) => {
      try {
        await focusFolder(context, uri);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Focus folder failed: ${message}`);
      }
    }
  );

  const exitCommand = vscode.commands.registerCommand(
    "projectToolkit.exitFocusFolder",
    async () => {
      try {
        await exitFocusFolder(context);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Exit focus folder failed: ${message}`);
      }
    }
  );

  const resetCommand = vscode.commands.registerCommand(
    "projectToolkit.resetFocusFolder",
    async () => {
      try {
        await resetFocusFolder(context);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Reset focus folder failed: ${message}`);
      }
    }
  );

  context.subscriptions.push(focusCommand, exitCommand, resetCommand);

  restoreUiState(context);
}

async function focusFolder(context, uri) {
  if (!uri) {
    vscode.window.showErrorMessage("Please right-click a folder.");
    return;
  }

  if (!(await isDirectory(uri))) {
    vscode.window.showErrorMessage("Please right-click a folder, not a file.");
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Selected folder is not inside a workspace.");
    return;
  }

  const workspaceRootUri = workspaceFolder.uri;
  const relativeToWorkspace = getRelativePath(workspaceRootUri, uri);

  if (!relativeToWorkspace || relativeToWorkspace === ".") {
    vscode.window.showWarningMessage(
      "You selected the workspace root. There is nothing to focus."
    );
    return;
  }

  const keepParts = relativeToWorkspace
    .split("/")
    .map(x => x.trim())
    .filter(Boolean);

  if (keepParts.length === 0) {
    vscode.window.showWarningMessage(
      "You selected the workspace root. There is nothing to focus."
    );
    return;
  }

  const filesConfig = vscode.workspace.getConfiguration(
    "files",
    workspaceFolder.uri
  );

  const explorerConfig = vscode.workspace.getConfiguration("explorer");
  const compactFoldersInspect = explorerConfig.inspect("compactFolders");

  const previousWorkspaceCompactFolders =
    compactFoldersInspect &&
    Object.prototype.hasOwnProperty.call(compactFoldersInspect, "workspaceValue")
      ? compactFoldersInspect.workspaceValue
      : undefined;

  const currentExclude = filesConfig.get("exclude") || {};
  const existingBackup = context.workspaceState.get(STORAGE_KEY);

  let originalExclude;

  if (
    existingBackup &&
    existingBackup.workspaceFolderUri === workspaceFolder.uri.toString()
  ) {
    originalExclude = existingBackup.originalExclude || {};
  } else {
    originalExclude = removeKnownFocusRules(currentExclude, []);
  }

  const generatedRules = await buildFocusExcludeRules(
    workspaceRootUri,
    keepParts
  );

  const nextExclude = {
    ...originalExclude,
    ...generatedRules
  };

  const focusedName = keepParts[keepParts.length - 1];

  await context.workspaceState.update(STORAGE_KEY, {
    workspaceFolderUri: workspaceFolder.uri.toString(),
    focusedUri: uri.toString(),
    focusedName,
    originalExclude,
    generatedRuleKeys: Object.keys(generatedRules),
    previousWorkspaceCompactFolders
  });

  await filesConfig.update(
    "exclude",
    nextExclude,
    vscode.ConfigurationTarget.WorkspaceFolder
  );

  await explorerConfig.update(
    "compactFolders",
    false,
    vscode.ConfigurationTarget.Workspace
  );

  await setFocusModeActive(true);

  statusBarItem.text = `$(eye-closed) Exit Focus: ${focusedName}`;
  statusBarItem.tooltip = `Exit focus mode: ${relativeToWorkspace}`;

  await revealInExplorer(uri);

  vscode.window.showInformationMessage(`Focused folder: ${focusedName}`);
}

async function buildFocusExcludeRules(workspaceRootUri, keepParts) {
  const rules = {};

  let currentFolderUri = workspaceRootUri;
  const currentRelativeParts = [];

  for (let level = 0; level < keepParts.length; level++) {
    const keepName = keepParts[level];
    const entries = await readDirectory(currentFolderUri);

    for (const [entryName] of entries) {
      if (entryName === keepName) {
        continue;
      }

      const excludePath = [...currentRelativeParts, entryName].join("/");

      if (excludePath) {
        rules[excludePath] = true;
      }
    }

    currentRelativeParts.push(keepName);
    currentFolderUri = joinPath(workspaceRootUri, ...currentRelativeParts);
  }

  return rules;
}

async function exitFocusFolder(context) {
  const backup = context.workspaceState.get(STORAGE_KEY);

  if (!backup || !backup.workspaceFolderUri) {
    vscode.window.showWarningMessage("No focus folder backup found.");
    await setFocusModeActive(false);
    return;
  }

  const workspaceUri = vscode.Uri.parse(backup.workspaceFolderUri);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(workspaceUri);

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Original workspace folder was not found.");
    await context.workspaceState.update(STORAGE_KEY, undefined);
    await setFocusModeActive(false);
    return;
  }

  const filesConfig = vscode.workspace.getConfiguration(
    "files",
    workspaceFolder.uri
  );

  const explorerConfig = vscode.workspace.getConfiguration("explorer");

  await filesConfig.update(
    "exclude",
    backup.originalExclude || {},
    vscode.ConfigurationTarget.WorkspaceFolder
  );

  await explorerConfig.update(
    "compactFolders",
    backup.previousWorkspaceCompactFolders,
    vscode.ConfigurationTarget.Workspace
  );

  await context.workspaceState.update(STORAGE_KEY, undefined);
  await setFocusModeActive(false);

  if (backup.focusedUri) {
    await revealInExplorer(vscode.Uri.parse(backup.focusedUri));
  }

  vscode.window.showInformationMessage("Focus folder mode exited.");
}

async function resetFocusFolder(context) {
  const backup = context.workspaceState.get(STORAGE_KEY);

  const workspaceFolders = vscode.workspace.workspaceFolders || [];

  for (const workspaceFolder of workspaceFolders) {
    const filesConfig = vscode.workspace.getConfiguration(
      "files",
      workspaceFolder.uri
    );

    const currentExclude = filesConfig.get("exclude") || {};
    const cleanedExclude = removeKnownFocusRules(
      currentExclude,
      backup?.generatedRuleKeys || []
    );

    await filesConfig.update(
      "exclude",
      cleanedExclude,
      vscode.ConfigurationTarget.WorkspaceFolder
    );
  }

  const explorerConfig = vscode.workspace.getConfiguration("explorer");

  if (backup && "previousWorkspaceCompactFolders" in backup) {
    await explorerConfig.update(
      "compactFolders",
      backup.previousWorkspaceCompactFolders,
      vscode.ConfigurationTarget.Workspace
    );
  }

  await context.workspaceState.update(STORAGE_KEY, undefined);
  await setFocusModeActive(false);

  vscode.window.showInformationMessage("Focus folder mode reset.");
}

function removeKnownFocusRules(exclude, generatedRuleKeys) {
  const result = {
    ...exclude
  };

  for (const key of generatedRuleKeys || []) {
    delete result[key];
  }

  return result;
}

async function restoreUiState(context) {
  const backup = context.workspaceState.get(STORAGE_KEY);

  if (backup && backup.focusedName) {
    statusBarItem.text = `$(eye-closed) Exit Focus: ${backup.focusedName}`;
    statusBarItem.tooltip = "Exit focus folder mode";
  }

  await setFocusModeActive(!!backup);
}

async function setFocusModeActive(isActive) {
  await vscode.commands.executeCommand(
    "setContext",
    CONTEXT_KEY,
    isActive
  );

  if (isActive) {
    statusBarItem.show();
  } else {
    statusBarItem.text = "$(eye-closed) Exit Focus";
    statusBarItem.tooltip = "Exit Focus Folder mode";
    statusBarItem.hide();
  }
}

function getRelativePath(workspaceRootUri, selectedUri) {
  const rootPath = normalizeAbsolutePath(workspaceRootUri.fsPath);
  const selectedPath = normalizeAbsolutePath(selectedUri.fsPath);

  if (!selectedPath.startsWith(rootPath)) {
    return "";
  }

  return normalizePath(selectedPath.slice(rootPath.length));
}

function normalizeAbsolutePath(value) {
  return String(value)
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
}

async function revealInExplorer(uri) {
  try {
    await vscode.commands.executeCommand("workbench.view.explorer");
    await vscode.commands.executeCommand("revealInExplorer", uri);
  } catch {
    // Best-effort only.
  }
}

module.exports = {
  registerFocusFolderFeature
};