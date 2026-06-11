const vscode = require("vscode");

const SECTION_ID = "templates";

const templatesSection = {
  id: SECTION_ID,

  getHtml() {
    return `
<section class="pt-section" id="templatesSection">
  <div class="pt-section-header">
    <h3 class="pt-section-title">Templates</h3>

    <div class="pt-section-actions">
      <button
        id="templatesCollapseButton"
        class="pt-collapse-button"
        type="button"
        aria-expanded="false"
        title="Expand or collapse Templates"
      >
        <span class="pt-collapse-icon">▶</span>
      </button>
    </div>
  </div>

  <div id="templatesContent" class="pt-section-content pt-hidden">
    <p class="pt-description">
      Open or create Project Toolkit template files.
    </p>
    <button id="openFolderTemplatesButton" class="pt-button secondary">Open Folder Templates</button>
    <button id="openFileTemplatesButton" class="pt-button secondary">Open File Templates</button>
  </div>
</section>`;
  },

  getCss() {
    return "";
  },

  getScript() {
    return `
(function () {
  const section = "${SECTION_ID}";

  const collapseButton = document.getElementById("templatesCollapseButton");
  const content = document.getElementById("templatesContent");

  const controller = createPanelSectionController({
    section,
    toggle: null,
    collapseButton,
    content,
    defaultEnabled: true,
    defaultExpanded: false,
    persistEnabled: false
  });

  document.getElementById("openFolderTemplatesButton").addEventListener("click", () => {
    postSectionMessage(section, "openFolderTemplates", {});
  });

  document.getElementById("openFileTemplatesButton").addEventListener("click", () => {
    postSectionMessage(section, "openFileTemplates", {});
  });

  controller.render();
})();`;
  },

  async getState() {
    return {};
  },

  async handleMessage({ command }) {
    switch (command) {
      case "setupExtension":
        await vscode.commands.executeCommand("projectToolkit.setupExtension", {
          silent: true
        });

        return {
          info: "Project Toolkit setup completed."
        };

      case "openFolderTemplates":
        await vscode.commands.executeCommand("projectToolkit.openFolderTemplates");

        return {
          info: "Folder Templates opened."
        };

      case "openFileTemplates":
        await vscode.commands.executeCommand("projectToolkit.openFileTemplates");

        return {
          info: "File Templates opened."
        };

      default:
        throw new Error(`Unknown Templates command: ${command}`);
    }
  }
};

module.exports = {
  templatesSection
};