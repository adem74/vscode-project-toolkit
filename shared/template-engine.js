const vscode = require("vscode");
const path = require("path");

const {
  exists,
  isDirectory,
  ensureDirectory,
  readText,
  writeText,
  readDirectory,
  joinPath,
  joinRelativePath,
  normalizePath
} = require("./fs-utils");

const {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  stripLastPascalWord,
  stripSuffix,
  pluralizeSimple
} = require("./text-utils");

async function loadTemplates(workspaceFolder) {
  const templatesRoot = joinPath(
    workspaceFolder.uri,
    ".vscode",
    "Project Toolkit",
    "File Templates"
  );

  if (!(await isDirectory(templatesRoot))) {
    return [];
  }

  const entries = await readDirectory(templatesRoot);
  const templates = [];

  for (const [name, type] of entries) {
    if (type !== vscode.FileType.Directory) {
      continue;
    }

    const templateFolderUri = joinPath(templatesRoot, name);
    const manifestUri = joinPath(templateFolderUri, "template.json");

    if (!(await exists(manifestUri))) {
      continue;
    }

    const manifestText = await readText(manifestUri);
    const definition = JSON.parse(manifestText);

    templates.push({
      id: name,
      folderUri: templateFolderUri,
      manifestUri,
      definition: {
        name: definition.name || name,
        description: definition.description || "",
        inputs: definition.inputs || [],
        vars: definition.vars || {},
        folders: definition.folders || [],
        files: definition.files || []
      }
    });
  }

  return templates.sort((a, b) =>
    a.definition.name.localeCompare(b.definition.name)
  );
}

async function runTemplate(template, targetFolderUri, workspaceFolder) {
  const projectInfo = await getProjectInfo(targetFolderUri, workspaceFolder);

  const context = {
    workspace: {
      name: workspaceFolder.name,
      path: workspaceFolder.uri.fsPath
    },
    project: projectInfo,
    target: buildTargetContext(targetFolderUri, projectInfo),
    now: new Date().toISOString()
  };

  await collectInputs(template.definition.inputs, context);
  resolveVars(template.definition.vars, context);

  const openedFiles = [];

  for (const folderPattern of template.definition.folders) {
    const renderedFolder = render(folderPattern, context);
    const folderUri = joinRelativePath(targetFolderUri, renderedFolder);

    await ensureDirectory(folderUri);
  }

  for (const file of template.definition.files) {
    const renderedPath = render(file.path, context);
    const fileUri = joinRelativePath(targetFolderUri, renderedPath);

    const fileContext = {
      ...context,
      file: buildFileContext(fileUri, projectInfo)
    };

    let content = "";

    if (file.source) {
      const sourceUri = joinRelativePath(template.folderUri, file.source);
      content = await readText(sourceUri);
    } else if (typeof file.content === "string") {
      content = file.content;
    }

    content = render(content, fileContext);

    const parentUri = vscode.Uri.joinPath(fileUri, "..");
    await ensureDirectory(parentUri);

    if ((await exists(fileUri)) && file.overwrite !== true) {
      const answer = await vscode.window.showWarningMessage(
        `${vscode.workspace.asRelativePath(fileUri)} already exists.`,
        "Skip",
        "Overwrite",
        "Cancel"
      );

      if (answer === "Cancel" || !answer) {
        return;
      }

      if (answer === "Skip") {
        continue;
      }
    }

    await writeText(fileUri, content);

    if (file.open === true) {
      openedFiles.push(fileUri);
    }
  }

  for (const fileUri of openedFiles) {
    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc, { preview: false });
  }
}

async function collectInputs(inputs, context) {
  for (const input of inputs) {
    const value = await vscode.window.showInputBox({
      title: input.label || input.name,
      prompt: input.label || input.name,
      placeHolder: input.placeholder || "",
      value: input.default || "",
      validateInput(value) {
        if (input.required !== false && !value.trim()) {
          return `${input.label || input.name} is required.`;
        }

        return null;
      }
    });

    if (value === undefined) {
      throw new Error("Template cancelled.");
    }

    context[input.name] = value.trim();
  }
}

function resolveVars(vars, context) {
  for (let i = 0; i < 10; i++) {
    let changed = false;

    for (const [key, value] of Object.entries(vars)) {
      const rendered = render(value, context);

      if (context[key] !== rendered) {
        context[key] = rendered;
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }
}

function render(templateText, context) {
  return String(templateText).replace(/{{\s*([^}]+)\s*}}/g, (_, expression) => {
    const value = evaluateExpression(expression, context);

    if (value === undefined || value === null) {
      throw new Error(`Unknown template variable: {{${expression}}}`);
    }

    return String(value);
  });
}

function evaluateExpression(expression, context) {
  const parts = expression
    .split("|")
    .map(x => x.trim())
    .filter(Boolean);

  const variableName = parts.shift();

  let value = getValue(context, variableName);

  for (const transform of parts) {
    value = applyTransform(String(value || ""), transform);
  }

  return value;
}

function getValue(context, pathExpression) {
  const parts = String(pathExpression)
    .split(".")
    .map(x => x.trim())
    .filter(Boolean);

  let current = context;

  for (const part of parts) {
    if (
      current === undefined ||
      current === null ||
      typeof current !== "object" ||
      !(part in current)
    ) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function applyTransform(value, transformExpression) {
  const [nameRaw, ...rest] = transformExpression.split(":");
  const name = String(nameRaw || "").trim();
  const arg = rest.join(":").trim();
  if (/^\d+$/.test(name)) {
    return removeLastNamespaceParts(value, parseNamespaceUpCount(name));
  }

  switch (name) {
    case "pascal":
      return toPascalCase(value);

    case "camel":
      return toCamelCase(value);

    case "kebab":
      return toKebabCase(value);

    case "snake":
      return toSnakeCase(value);

    case "lower":
      return value.toLowerCase();

    case "upper":
      return value.toUpperCase();

    case "trim":
      return value.trim();

    case "plural":
      return pluralizeSimple(value);

    case "stripLastPascal":
      return stripLastPascalWord(value);

    case "stripSuffix":
      return stripSuffix(value, arg);

    case "namespaceUp":
      return removeLastNamespaceParts(value, parseNamespaceUpCount(arg));

    case "up":
      return removeLastNamespaceParts(value, parseNamespaceUpCount(arg));

    default:
      throw new Error(`Unknown transform: ${name}`);
  }
}

async function getProjectInfo(targetFolderUri, workspaceFolder) {
  const projectRoot = await findNearestProjectRoot(
    targetFolderUri,
    workspaceFolder.uri
  );

  let rootNamespace;

  if (projectRoot.csprojName) {
    rootNamespace = sanitizeNamespace(projectRoot.csprojName);
  } else {
    rootNamespace = sanitizeNamespace(workspaceFolder.name);
  }

  return {
    rootUri: projectRoot.uri,
    rootPath: projectRoot.uri.fsPath,
    rootNamespace
  };
}

async function findNearestProjectRoot(startUri, workspaceRootUri) {
  let current = startUri;

  while (isInsideOrSame(current.fsPath, workspaceRootUri.fsPath)) {
    const entries = await readDirectory(current);

    const csproj = entries.find(([name, type]) =>
      type === vscode.FileType.File && name.endsWith(".csproj")
    );

    if (csproj) {
      return {
        uri: current,
        csprojName: path.basename(csproj[0], ".csproj")
      };
    }

    const parentPath = path.dirname(current.fsPath);

    if (parentPath === current.fsPath) {
      break;
    }

    current = vscode.Uri.file(parentPath);
  }

  return {
    uri: workspaceRootUri,
    csprojName: ""
  };
}

function isInsideOrSame(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function buildTargetContext(targetFolderUri, projectInfo) {
  const relativeToProject = normalizePath(
    path.relative(projectInfo.rootPath, targetFolderUri.fsPath)
  );

  const parts = relativeToProject && relativeToProject !== "."
    ? relativeToProject.split("/").filter(Boolean)
    : [];

  const targetNamespace = [projectInfo.rootNamespace, ...parts].join(".");
  const moduleNamespace = removeLastNamespaceParts(targetNamespace, 1);

  return {
    path: targetFolderUri.fsPath,
    relative: relativeToProject === "." ? "" : relativeToProject,

    namespace: targetNamespace,

    rootNamespace: projectInfo.rootNamespace,
    moduleNamespace
  };
}

function buildFileContext(fileUri, projectInfo) {
  const relativeToProject = normalizePath(
    path.relative(projectInfo.rootPath, fileUri.fsPath)
  );

  const directoryRelative = normalizePath(path.dirname(relativeToProject));

  const directoryParts = directoryRelative && directoryRelative !== "."
    ? directoryRelative.split("/").filter(Boolean)
    : [];

  const fileName = path.basename(fileUri.fsPath);
  const extension = path.extname(fileName);
  const fileNameWithoutExtension = extension
    ? fileName.slice(0, -extension.length)
    : fileName;

  const fileNamespace = [projectInfo.rootNamespace, ...directoryParts].join(".");
  const moduleNamespace = removeLastNamespaceParts(fileNamespace, 1);

  return {
    path: fileUri.fsPath,
    relative: relativeToProject,
    directory: directoryRelative === "." ? "" : directoryRelative,
    name: fileName,
    nameNoExtension: fileNameWithoutExtension,
    extension,
    namespace: fileNamespace,
    rootNamespace: projectInfo.rootNamespace,
    moduleNamespace
  };
}

function removeLastNamespaceParts(namespaceValue, count = 1) {
  const parts = String(namespaceValue)
    .split(".")
    .map(x => x.trim())
    .filter(Boolean);

  const removeCount = parseNamespaceUpCount(count);

  if (parts.length <= removeCount) {
    return parts.length > 0 ? parts[0] : String(namespaceValue);
  }

  return parts.slice(0, parts.length - removeCount).join(".");
}

function parseNamespaceUpCount(value) {
  const count = Number.parseInt(String(value || "1"), 10);

  if (Number.isNaN(count) || count < 0) {
    throw new Error(`Invalid namespaceUp count: ${value}`);
  }

  return count;
}

function sanitizeNamespace(value) {
  return String(value)
    .split(".")
    .map(part => sanitizeNamespacePart(part))
    .filter(Boolean)
    .join(".");
}

function sanitizeNamespacePart(value) {
  const text = String(value).trim();

  if (!text) {
    return "";
  }
 
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    return text;
  }
 
  let cleaned = toPascalCase(text.replace(/[^A-Za-z0-9_]+/g, " "));

  if (!cleaned) {
    return "";
  }
 
  if (/^[0-9]/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }

  return cleaned;
}

module.exports = {
  loadTemplates,
  runTemplate,
  render
};