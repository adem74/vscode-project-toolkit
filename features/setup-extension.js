const vscode = require("vscode");

const {
  exists,
  ensureDirectory,
  writeText,
  joinPath
} = require("../shared/fs-utils");

function registerSetupExtensionFeature(context) {
  const setupCommand = vscode.commands.registerCommand(
    "projectToolkit.setupExtension",
    async (uri) => {
      try {
        const workspaceFolder = resolveWorkspaceFolder(uri);

        if (!workspaceFolder) {
          vscode.window.showErrorMessage("Please open a workspace first.");
          return;
        }

        const result = await setupProjectToolkit(workspaceFolder);

        vscode.window.showInformationMessage(
          result.createdCount > 0
            ? `Project Toolkit setup completed. Created ${result.createdCount} item(s).`
            : "Project Toolkit is already set up."
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Project Toolkit setup failed: ${message}`);
      }
    }
  );

  const openFolderTemplatesCommand = vscode.commands.registerCommand(
    "projectToolkit.openFolderTemplates",
    async (uri) => {
      try {
        const workspaceFolder = resolveWorkspaceFolder(uri);

        if (!workspaceFolder) {
          vscode.window.showErrorMessage("Please open a workspace first.");
          return;
        }

        await setupProjectToolkit(workspaceFolder);
        await openFolderTemplatesSettingsFile(workspaceFolder);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Open Folder Templates failed: ${message}`);
      }
    }
  );

  const openFileTemplatesCommand = vscode.commands.registerCommand(
    "projectToolkit.openFileTemplates",
    async (uri) => {
      try {
        const workspaceFolder = resolveWorkspaceFolder(uri);

        if (!workspaceFolder) {
          vscode.window.showErrorMessage("Please open a workspace first.");
          return;
        }

        await setupProjectToolkit(workspaceFolder);
        await revealFileTemplatesFolder(workspaceFolder);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Open File Templates failed: ${message}`);
      }
    }
  );

  context.subscriptions.push(
    setupCommand,
    openFolderTemplatesCommand,
    openFileTemplatesCommand
  );
}

async function autoSetupProjectToolkit(context) {
  const workspaceFolders = vscode.workspace.workspaceFolders || [];

  for (const workspaceFolder of workspaceFolders) {
    try {
      await setupProjectToolkit(workspaceFolder);
    } catch (error) {
      console.error(
        `[Project Toolkit] Auto setup failed for ${workspaceFolder.name}:`,
        error
      );
    }
  }

  const workspaceChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(
    async (event) => {
      for (const workspaceFolder of event.added) {
        try {
          await setupProjectToolkit(workspaceFolder);
        } catch (error) {
          console.error(
            `[Project Toolkit] Auto setup failed for ${workspaceFolder.name}:`,
            error
          );
        }
      }
    }
  );

  context.subscriptions.push(workspaceChangeDisposable);
}

function resolveWorkspaceFolder(uri) {
  if (uri) {
    const folder = vscode.workspace.getWorkspaceFolder(uri);

    if (folder) {
      return folder;
    }
  }

  const activeUri = vscode.window.activeTextEditor?.document?.uri;

  if (activeUri) {
    const folder = vscode.workspace.getWorkspaceFolder(activeUri);

    if (folder) {
      return folder;
    }
  }

  return vscode.workspace.workspaceFolders?.[0];
}

async function setupProjectToolkit(workspaceFolder) {
  const uris = getProjectToolkitUris(workspaceFolder);
  let createdCount = 0;

  createdCount += await ensureDirectoryCreated(uris.root);
  createdCount += await ensureDirectoryCreated(uris.folderTemplates);
  createdCount += await ensureDirectoryCreated(uris.fileTemplates);
  createdCount += await ensureDirectoryCreated(uris.sampleTemplate);

  createdCount += await writeTextIfMissing(
    uris.folderTemplatesSettings,
    getDefaultFolderTemplatesSettings()
  );

  createdCount += await writeTextIfMissing(
    uris.sampleTemplateManifest,
    getSampleClassTemplateManifest()
  );

  createdCount += await writeTextIfMissing(
    uris.sampleTemplateSource,
    getSampleClassTemplateSource()
  );

  return {
    createdCount
  };
}

function getProjectToolkitUris(workspaceFolder) {
  const root = joinPath(
    workspaceFolder.uri,
    ".vscode",
    "Project Toolkit"
  );

  const folderTemplates = joinPath(
    root,
    "Folder Templates"
  );

  const fileTemplates = joinPath(
    root,
    "File Templates"
  );

  const sampleTemplate = joinPath(
    fileTemplates,
    "sample-csharp-class"
  );

  return {
    root,

    folderTemplates,
    folderTemplatesSettings: joinPath(folderTemplates, "settings.json"),

    fileTemplates,

    sampleTemplate,
    sampleTemplateManifest: joinPath(sampleTemplate, "template.json"),
    sampleTemplateSource: joinPath(sampleTemplate, "Class.cs.tpl")
  };
}

async function ensureDirectoryCreated(uri) {
  if (await exists(uri)) {
    return 0;
  }

  await ensureDirectory(uri);
  return 1;
}

async function writeTextIfMissing(uri, content) {
  if (await exists(uri)) {
    return 0;
  }

  await writeText(uri, content);
  return 1;
}

async function openFolderTemplatesSettingsFile(workspaceFolder) {
  const uris = getProjectToolkitUris(workspaceFolder);

  const doc = await vscode.workspace.openTextDocument(uris.folderTemplatesSettings);
  await vscode.window.showTextDocument(doc, { preview: false });
}

async function revealFileTemplatesFolder(workspaceFolder) {
  const uris = getProjectToolkitUris(workspaceFolder);

  await vscode.commands.executeCommand("workbench.view.explorer");
  await vscode.commands.executeCommand("revealInExplorer", uris.fileTemplates);
}

function getDefaultFolderTemplatesSettings() {
  return JSON.stringify(
    {
      presets: [
        {
          name: "Module Folders",
          description: "Default modular project folders.",
          askModuleName: true,
          folders: [
            "DTO",
            "Models",
            "Repositories",
            "Features",
            "Features/Commands",
            "Features/Queries",
            "Services",
            "Cache",
            "Enums"
          ]
        },
        {
          name: "CQRS Folders",
          description: "Create Commands and Queries folders inside the selected folder.",
          askModuleName: false,
          folders: [
            "Commands",
            "Queries"
          ]
        }
      ]
    },
    null,
    2
  ) + "\n";
}

function getSampleClassTemplateManifest() {
  return JSON.stringify(
    {
      name: "Sample C# Class",
      description: "Create a simple C# class.",
      inputs: [
        {
          name: "className",
          label: "Class name",
          default: "ProductService"
        }
      ],
      vars: {
        class: "{{className|pascal}}"
      },
      files: [
        {
          path: "{{class}}.cs",
          source: "Class.cs.tpl",
          open: true,
          overwrite: false
        }
      ]
    },
    null,
    2
  ) + "\n";
}

function getSampleClassTemplateSource() {
  return `namespace {{file.namespace}};

public sealed class {{class}}
{
}
`;
}

module.exports = {
  registerSetupExtensionFeature,
  autoSetupProjectToolkit,
  setupProjectToolkit
};