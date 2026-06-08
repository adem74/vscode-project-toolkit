const vscode = require("vscode");
const { isDirectory } = require("../shared/fs-utils");
const { loadTemplates, runTemplate } = require("../shared/template-engine");

function registerCreateFileFromTemplateFeature(context) {
  const disposable = vscode.commands.registerCommand(
    "projectToolkit.createFileFromTemplate",
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

        const templates = await loadTemplates(workspaceFolder);

        if (templates.length === 0) {
          vscode.window.showWarningMessage("No file templates found in .vscode/Project Toolkit/File Templates.");
          return;
        }

        const selected = await vscode.window.showQuickPick(
          templates.map(template => ({
            label: template.definition.name,
            description: template.definition.description,
            template
          })),
          {
            title: "Create File From Template",
            placeHolder: "Select a template"
          }
        );

        if (!selected) {
          return;
        }

        await runTemplate(selected.template, uri, workspaceFolder);

        vscode.window.showInformationMessage(
          `Template created: ${selected.template.definition.name}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Create file from template failed: ${message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

module.exports = {
  registerCreateFileFromTemplateFeature
};