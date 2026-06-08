const vscode = require("vscode");
const { toPascalCase } = require("../shared/text-utils");
const {
  exists,
  isDirectory,
  createDirectory,
  joinPath,
  readText
} = require("../shared/fs-utils");

const CONFIG_PATH = [".vscode", "Project Toolkit", "Folder Templates", "settings.json"];

function registerCreateFoldersFeature(context) {
  const disposable = vscode.commands.registerCommand(
    "projectToolkit.createFolders",
    async (uri) => {
      try {
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

        const config = await loadFolderConfig(workspaceFolder);

        if (!config.presets || config.presets.length === 0) {
          vscode.window.showWarningMessage("No folder presets found in .vscode/Project Toolkit/Folder Templates/settings.json.");
          return;
        }

        const selectedPreset = await selectPreset(config.presets);

        if (!selectedPreset) {
          return;
        }

        let baseUri = uri;
        let moduleName = "";

        if (selectedPreset.askModuleName !== false) {
          const input = await vscode.window.showInputBox({
            title: selectedPreset.name,
            prompt: "Enter folder/module name",
            placeHolder: "Product",
            value: "Product",
            validateInput(value) {
              if (!value || !value.trim()) {
                return "Name is required.";
              }

              if (!/^[a-zA-Z][a-zA-Z0-9\s_-]*$/.test(value.trim())) {
                return "Use letters, numbers, spaces, - or _.";
              }

              return null;
            }
          });

          if (!input) {
            return;
          }

          moduleName = toPascalCase(input);
          baseUri = joinPath(uri, moduleName);

          await createDirectory(baseUri);
        }

        for (const folder of selectedPreset.folders) {
          const folderParts = folder.split("/").filter(Boolean);
          const folderUri = joinPath(baseUri, ...folderParts);

          await createDirectory(folderUri);
        }

        vscode.window.showInformationMessage(
          moduleName
            ? `Created folders: ${moduleName}`
            : `Created folders from preset: ${selectedPreset.name}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Create folders failed: ${message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function loadFolderConfig(workspaceFolder) {
  const configUri = joinPath(workspaceFolder.uri, ...CONFIG_PATH);

  if (!(await exists(configUri))) {
    throw new Error( "Missing config file: .vscode/Project Toolkit/Folder Templates/settings.json");
  }

  const json = await readText(configUri);

  try {
    const config = JSON.parse(json);

    if (!Array.isArray(config.presets)) {
      throw new Error("folders.json must contain a presets array.");
    }

    for (const preset of config.presets) {
      if (!preset.name) {
        throw new Error("Every preset must have a name.");
      }

      if (!Array.isArray(preset.folders)) {
        throw new Error(`Preset "${preset.name}" must have a folders array.`);
      }
    }

    return config;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid folder template settings.json: ${message}`);
  }
}

async function selectPreset(presets) {
  if (presets.length === 1) {
    return presets[0];
  }

  const selected = await vscode.window.showQuickPick(
    presets.map(preset => ({
      label: preset.name,
      description: preset.description || "",
      preset
    })),
    {
      title: "Create Folders",
      placeHolder: "Select folder preset"
    }
  );

  return selected?.preset;
}

module.exports = {
  registerCreateFoldersFeature
};