function splitWords(value) {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-./\\]+/)
    .filter(Boolean);
}

function toPascalCase(value) {
  return splitWords(value)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(value) {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(value) {
  return splitWords(value)
    .map(word => word.toLowerCase())
    .join("-");
}

function toSnakeCase(value) {
  return splitWords(value)
    .map(word => word.toLowerCase())
    .join("_");
}

function stripLastPascalWord(value) {
  const text = String(value);
  const match = text.match(/^(.+?)([A-Z][a-z0-9]*|[A-Z]+)$/);

  if (!match) {
    return text;
  }

  return match[1];
}

function stripSuffix(value, suffix) {
  const text = String(value);

  if (!suffix) {
    return text;
  }

  return text.endsWith(suffix)
    ? text.slice(0, -suffix.length)
    : text;
}

function pluralizeSimple(value) {
  const text = String(value);

  if (text.endsWith("y")) {
    return `${text.slice(0, -1)}ies`;
  }

  if (text.endsWith("s")) {
    return `${text}es`;
  }

  return `${text}s`;
}

function sanitizeIdentifier(value) {
  return toPascalCase(value).replace(/[^a-zA-Z0-9_]/g, "");
}

module.exports = {
  splitWords,
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  stripLastPascalWord,
  stripSuffix,
  pluralizeSimple,
  sanitizeIdentifier
};