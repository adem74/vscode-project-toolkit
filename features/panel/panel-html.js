function getPanelHtml(sections) {
  const sectionCss = sections
    .map(section => typeof section.getCss === "function" ? section.getCss() : "")
    .join("\n");

  const sectionHtml = sections
    .map(section => typeof section.getHtml === "function" ? section.getHtml() : "")
    .join("\n");

  const sectionScripts = sections
    .map(section => typeof section.getScript === "function" ? section.getScript() : "")
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project Toolkit</title>

  <style>
    body {
      padding: 14px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background: var(--vscode-sideBar-background);
    }

    h2 {
      font-size: 18px;
      margin: 0 0 18px;
    }

    .pt-notification {
      position: sticky;
      top: 0;
      z-index: 10;
      display: none;
      margin-bottom: 12px;
      padding: 9px 10px;
      border-radius: 5px;
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editorWidget-background);
      color: var(--vscode-editorWidget-foreground);
      font-size: 12px;
      line-height: 1.4;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    }

    .pt-notification.visible {
      display: block;
    }

    .pt-notification.info {
      border-left: 3px solid var(--vscode-testing-iconPassed);
    }

    .pt-notification.warning {
      border-left: 3px solid var(--vscode-editorWarning-foreground);
    }

    .pt-notification.error {
      border-left: 3px solid var(--vscode-editorError-foreground);
    }

    .pt-section {
      border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 14px;
    }

    .pt-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .pt-section-title {
      font-size: 14px;
      margin: 0;
      color: var(--vscode-sideBarSectionHeader-foreground);
    }

    .pt-section-actions {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .pt-section-content {
      margin-top: 12px;
    }

    .pt-description {
      font-size: 12px;
      opacity: 0.8;
      line-height: 1.45;
      margin: 0 0 12px;
    }

    .pt-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
    }

    .pt-button {
      width: 100%;
      margin-top: 8px;
      padding: 7px 10px;
      color: var(--vscode-button-foreground);
      background: var(--vscode-button-background);
      border: none;
      cursor: pointer;
      border-radius: 3px;
      text-align: center;
    }

    .pt-button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .pt-button.secondary {
      color: var(--vscode-button-secondaryForeground);
      background: var(--vscode-button-secondaryBackground);
    }

    .pt-button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .pt-status {
      margin-top: 8px;
      font-size: 12px;
      opacity: 0.85;
    }

    .pt-hidden {
      display: none !important;
    }

    .pt-toggle {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }

    .pt-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }

    .pt-toggle-slider {
      width: 38px;
      height: 20px;
      border-radius: 999px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      cursor: pointer;
      position: relative;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .pt-toggle-slider::before {
      content: "";
      position: absolute;
      width: 14px;
      height: 14px;
      left: 3px;
      top: 2px;
      border-radius: 50%;
      background: var(--vscode-foreground);
      opacity: 0.8;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }

    .pt-toggle input:checked + .pt-toggle-slider {
      background: var(--vscode-button-background);
      border-color: var(--vscode-button-background);
    }

    .pt-toggle input:checked + .pt-toggle-slider::before {
      transform: translateX(18px);
      background: var(--vscode-button-foreground);
      opacity: 1;
    }

    .pt-toggle input:focus + .pt-toggle-slider {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }

    .pt-toggle input:disabled + .pt-toggle-slider {
      opacity: 0.55;
      cursor: default;
    }

    .pt-collapse-button {
      width: 24px;
      height: 24px;
      padding: 0;
      margin: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--vscode-foreground);
      background: transparent;
      border: 1px solid transparent;
      border-radius: 4px;
      cursor: pointer;
    }

    .pt-collapse-button:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }

    .pt-collapse-button:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }

    .pt-collapse-button:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .pt-collapse-button:disabled:hover {
      background: transparent;
    }

    .pt-collapse-icon {
      display: inline-block;
      font-size: 11px;
      line-height: 1;
      transform: rotate(0deg);
      transition: transform 0.12s ease;
      opacity: 0.85;
    }

    .pt-collapse-button[aria-expanded="true"] .pt-collapse-icon {
      transform: rotate(90deg);
    }

    ${sectionCss}
  </style>
</head>

<body>
  <h2>Project Toolkit</h2>

  <div id="panelNotification" class="pt-notification"></div>

  ${sectionHtml}

  <script>
    const vscode = acquireVsCodeApi();

    let notificationTimer = null;

    function showPanelNotification(message, level) {
      const element = document.getElementById("panelNotification");

      if (!element) {
        return;
      }

      window.clearTimeout(notificationTimer);

      element.textContent = message || "";
      element.className = "pt-notification visible " + (level || "info");

      notificationTimer = window.setTimeout(() => {
        element.className = "pt-notification";
        element.textContent = "";
      }, 3000);
    }

    function postSectionMessage(section, command, payload) {
      vscode.postMessage({
        type: "section.message",
        section,
        command,
        payload: payload || {}
      });
    }

    function listenSectionState(section, handler) {
      window.addEventListener("message", event => {
        const message = event.data;

        if (message.type === "section.state" && message.section === section) {
          handler(message.state);
        }

        if (message.type === "panel.error") {
          const errorEvent = new CustomEvent("projectToolkit.panelError", {
            detail: message
          });

          window.dispatchEvent(errorEvent);
        }
      });
    }

    window.addEventListener("message", event => {
      const message = event.data;

      if (message.type === "panel.notification") {
        showPanelNotification(message.message, message.level);
      }
    });

    function setVisible(element, visible) {
      if (!element) {
        return;
      }

      element.classList.toggle("pt-hidden", !visible);
    }

    function setToggleChecked(toggleInput, checked) {
      if (!toggleInput) {
        return;
      }

      toggleInput.checked = !!checked;
    }

    function setToggleDisabled(toggleInput, disabled) {
      if (!toggleInput) {
        return;
      }

      toggleInput.disabled = !!disabled;
    }

    function getPanelMemory() {
      return vscode.getState() || {};
    }

    function setPanelMemoryValue(key, value) {
      const state = getPanelMemory();
      state[key] = value;
      vscode.setState(state);
    }

    function getPanelMemoryValue(key, fallback) {
      const state = getPanelMemory();

      if (Object.prototype.hasOwnProperty.call(state, key)) {
        return state[key];
      }

      return fallback;
    }

    function createPanelSectionController(options) {
      const section = options.section;
      const toggle = options.toggle;
      const collapseButton = options.collapseButton;
      const content = options.content;

      const collapseKey = "collapse:" + section;
      const enabledKey = "enabled:" + section;

      const persistEnabled = options.persistEnabled === true;
      const defaultEnabled = options.defaultEnabled === true;
      const defaultExpanded = options.defaultExpanded === true;

      let enabled = persistEnabled
        ? !!getPanelMemoryValue(enabledKey, defaultEnabled)
        : defaultEnabled;

      let expanded = !!getPanelMemoryValue(collapseKey, defaultExpanded);

      const controller = {
        getEnabled() {
          return enabled;
        },

        getExpanded() {
          return expanded;
        },

        setEnabled(value) {
          enabled = !!value;

          if (persistEnabled) {
            setPanelMemoryValue(enabledKey, enabled);
          }

          render();
        },

        setExpanded(value) {
          expanded = !!value;
          setPanelMemoryValue(collapseKey, expanded);
          render();
        },

        setState(state) {
          if (!state) {
            render();
            return;
          }

          if (Object.prototype.hasOwnProperty.call(state, "enabled")) {
            enabled = !!state.enabled;

            if (persistEnabled) {
              setPanelMemoryValue(enabledKey, enabled);
            }
          }

          if (Object.prototype.hasOwnProperty.call(state, "expanded")) {
            expanded = !!state.expanded;
            setPanelMemoryValue(collapseKey, expanded);
          }

          render();
        },

        render
      };

      if (toggle) {
        toggle.addEventListener("change", () => {
          const nextEnabled = !!toggle.checked;

          if (typeof options.onToggle === "function") {
            options.onToggle(nextEnabled, controller);
          } else {
            controller.setEnabled(nextEnabled);

            if (nextEnabled) {
              controller.setExpanded(true);
            }
          }
        });
      }

      if (collapseButton) {
        collapseButton.addEventListener("click", () => {
          if (collapseButton.disabled) {
            return;
          }

          controller.setExpanded(!expanded);
        });
      }

      function render() {
        setToggleChecked(toggle, enabled);

        if (collapseButton) {
          collapseButton.disabled = !enabled;
          collapseButton.setAttribute("aria-expanded", expanded ? "true" : "false");
        }

        setVisible(content, enabled && expanded);

        if (typeof options.onRender === "function") {
          options.onRender({
            enabled,
            expanded
          });
        }
      }

      render();

      return controller;
    }

    ${sectionScripts}

    vscode.postMessage({
      type: "panel.ready"
    });
  </script>
</body>
</html>`;
}

module.exports = {
  getPanelHtml
};