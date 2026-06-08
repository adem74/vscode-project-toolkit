const {
  registerSetupExtensionFeature,
  autoSetupProjectToolkit
} = require("./features/setup-extension");

const { registerCreateFoldersFeature } = require("./features/create-folders");
const { registerCreateFileFromTemplateFeature } = require("./features/create-file-from-template");
const { registerFocusFolderFeature } = require("./features/focus-folder");

function activate(context) {
  registerSetupExtensionFeature(context);
  registerCreateFoldersFeature(context);
  registerCreateFileFromTemplateFeature(context);
  registerFocusFolderFeature(context);

  autoSetupProjectToolkit(context);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};