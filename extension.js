const {
  registerSetupExtensionFeature,
  autoSetupProjectToolkit
} = require("./features/setup-extension");

const { registerCreateFoldersFeature } = require("./features/create-folders");
const { registerCreateFileFromTemplateFeature } = require("./features/create-file-from-template");
const { registerFocusFolderFeature } = require("./features/focus-folder");
const { registerProjectToolkitPanelFeature } = require("./features/panel/project-toolkit-panel");
const { autoRunPanelSections } = require("./features/panel/panel-sections");

async function activate(context) {
  registerSetupExtensionFeature(context);
  registerCreateFoldersFeature(context);
  registerCreateFileFromTemplateFeature(context);
  registerFocusFolderFeature(context);
  registerProjectToolkitPanelFeature(context);

  await autoSetupProjectToolkit(context);
  await autoRunPanelSections(context);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};