const vscode = require("vscode");

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

async function exists(uri) {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function stat(uri) {
  try {
    return await vscode.workspace.fs.stat(uri);
  } catch {
    return undefined;
  }
}

async function isDirectory(uri) {
  const result = await stat(uri);
  return result?.type === vscode.FileType.Directory;
}

async function createDirectory(uri) {
  await vscode.workspace.fs.createDirectory(uri);
}

async function ensureDirectory(uri) {
  if (await isDirectory(uri)) {
    return;
  }

  await vscode.workspace.fs.createDirectory(uri);
}

async function readText(uri) {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return decoder.decode(bytes);
}

async function writeText(uri, content) {
  await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
}

async function readDirectory(uri) {
  try {
    return await vscode.workspace.fs.readDirectory(uri);
  } catch {
    return [];
  }
}

function joinPath(baseUri, ...parts) {
  return vscode.Uri.joinPath(baseUri, ...parts);
}

function normalizePath(value) {
  return String(value)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function joinRelativePath(baseUri, relativePath) {
  const parts = normalizePath(relativePath)
    .split("/")
    .filter(Boolean);

  return vscode.Uri.joinPath(baseUri, ...parts);
}

module.exports = {
  exists,
  stat,
  isDirectory,
  createDirectory,
  ensureDirectory,
  readText,
  writeText,
  readDirectory,
  joinPath,
  normalizePath,
  joinRelativePath
};