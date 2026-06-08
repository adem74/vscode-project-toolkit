const { registerCreateFoldersFeature } = require("./features/create-folders");
const { registerCreateFileFromTemplateFeature } = require("./features/create-file-from-template");
const { registerFocusFolderFeature } = require("./features/focus-folder");

function activate(context) {
  registerCreateFoldersFeature(context);
  registerCreateFileFromTemplateFeature(context);
  registerFocusFolderFeature(context);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};