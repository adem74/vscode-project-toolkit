const vscode = require("vscode");

const { workspaceColorsSection } = require("./sections/workspace-colors-section");
const { templatesSection } = require("./sections/templates-section");

const panelSections = [
  workspaceColorsSection,
  templatesSection
];

async function autoRunPanelSections(context) {
  const runForWorkspace = async (workspaceFolder) => {
    for (const section of panelSections) {
      if (typeof section.autoRun !== "function") {
        continue;
      }

      try {
        await section.autoRun({
          extensionContext: context,
          workspaceFolder
        });
      } catch (error) {
        console.error(
          `[Project Toolkit] Auto run failed for section "${section.id}" in workspace "${workspaceFolder.name}":`,
          error
        );
      }
    }
  };

  const workspaceFolders = vscode.workspace.workspaceFolders || [];

  for (const workspaceFolder of workspaceFolders) {
    await runForWorkspace(workspaceFolder);
  }

  const disposable = vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
    for (const workspaceFolder of event.added) {
      await runForWorkspace(workspaceFolder);
    }
  });

  context.subscriptions.push(disposable);
}

module.exports = {
  panelSections,
  autoRunPanelSections
};