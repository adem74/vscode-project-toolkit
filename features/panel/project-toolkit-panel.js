const vscode = require("vscode");

const { getPanelHtml } = require("./panel-html");
const { panelSections } = require("./panel-sections");

const VIEW_ID = "projectToolkit.panelView";

function registerProjectToolkitPanelFeature(context) {
  const provider = new ProjectToolkitPanelProvider(context);

  const disposable = vscode.window.registerWebviewViewProvider(
    VIEW_ID,
    provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true
      }
    }
  );

  context.subscriptions.push(disposable);
}

class ProjectToolkitPanelProvider {
  constructor(context) {
    this.context = context;
    this.view = undefined;
  }

  async resolveWebviewView(webviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = getPanelHtml(panelSections);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);

        this.postMessage({
          type: "panel.notification",
          level: "error",
          message: text
        });

        this.postMessage({
          type: "panel.error",
          message: text
        });
      }
    });
  }

  async handleMessage(message) {
    if (message.type === "panel.ready") {
      await this.postInitialState();
      return;
    }

    if (message.type !== "section.message") {
      return;
    }

    const section = panelSections.find(x => x.id === message.section);

    if (!section || typeof section.handleMessage !== "function") {
      throw new Error(`No panel section registered for: ${message.section}`);
    }

    const result = await section.handleMessage({
      command: message.command,
      payload: message.payload || {},
      context: this.createSectionContext()
    });

    if (!result) {
      return;
    }

    if (result.state !== undefined) {
      this.postMessage({
        type: "section.state",
        section: section.id,
        state: result.state
      });
    }

    if (result.info) {
      this.postMessage({
        type: "panel.notification",
        level: "info",
        message: result.info
      });
    }

    if (result.warning) {
      this.postMessage({
        type: "panel.notification",
        level: "warning",
        message: result.warning
      });
    }
  }

  async postInitialState() {
    for (const section of panelSections) {
      if (typeof section.getState !== "function") {
        continue;
      }

      const state = await section.getState(this.createSectionContext());

      this.postMessage({
        type: "section.state",
        section: section.id,
        state
      });
    }
  }

  createSectionContext() {
    return {
      extensionContext: this.context,
      postMessage: (message) => this.postMessage(message),
      getWorkspaceFolder
    };
  }

  postMessage(message) {
    this.view?.webview.postMessage(message);
  }
}

function getWorkspaceFolder() {
  const activeUri = vscode.window.activeTextEditor?.document?.uri;

  if (activeUri) {
    const activeWorkspaceFolder = vscode.workspace.getWorkspaceFolder(activeUri);

    if (activeWorkspaceFolder) {
      return activeWorkspaceFolder;
    }
  }

  return vscode.workspace.workspaceFolders?.[0];
}

module.exports = {
  registerProjectToolkitPanelFeature
};