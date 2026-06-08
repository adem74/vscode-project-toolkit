# Project Toolkit 

<p>
  <img src="https://img.shields.io/badge/VS%20Code-Extension-blue" />
  <img src="https://img.shields.io/badge/Templates-Workspace%20Based-green" />
  <img src="https://img.shields.io/badge/Focus%20Folder-Supported-purple" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

**Project Toolkit** is a VS Code extension which I made for myself. I hope it helps to you. If you need other features, please create issue.
It helps you create repeatable project structures, generate files from custom templates, and focus on one folder in large workspaces.

---

## Features

<table>
  <tr>
    <td width="33%">
      <h3>📁 Folder Templates</h3>
      <p>Create folders from workspace presets.</p>
      <p>Useful for modular projects, vertical slice architecture, CQRS, and custom team structures.</p>
    </td>
    <td width="33%">
      <h3>📄 File Templates</h3>
      <p>Generate files from custom templates stored inside your workspace.</p>
      <p>Supports variables, reusable values, transforms, namespaces, and multiple files per template.</p>
    </td>
    <td width="33%">
      <h3>🎯 Focus Folder</h3>
      <p>Temporarily focus one folder in the Explorer.</p>
      <p>Useful for large workspaces and modular monoliths.</p>
    </td>
  </tr>
</table>

---

## Installation

Install from the VS Code Marketplace:

```bash
ext install AdemUnal.project-toolkit
```

Or open VS Code and search:

```text
Project Toolkit
```

---

## Workspace Setup

Project Toolkit stores all workspace templates under:

```text
.vscode/Project Toolkit/
```

When the extension activates, it automatically creates missing starter folders and files.

Default generated structure:

```text
.vscode/
└── Project Toolkit/
    ├── Folder Templates/
    │   └── settings.json
    └── File Templates/
        └── sample-csharp-class/
            ├── template.json
            └── Class.cs.tpl
```

---

## Commands

### Explorer Context Menu

Right-click a folder in the Explorer:

```text
Project Toolkit
├── Create Module Folders
├── Create File From Template
├── Focus Folder
└── Exit Focus Folder
```

### Command Palette

Open the Command Palette and run:

```text
Project Toolkit: Open Folder Templates
Project Toolkit: Open File Templates
Project Toolkit: Reset Focus Folder
```

---

# Folder Templates

Folder Templates let you create folder structures from editable presets.

Folder template settings are stored here:

```text
.vscode/Project Toolkit/Folder Templates/settings.json
```

To open this file quickly:

```text
Command Palette > Project Toolkit: Open Folder Templates
```

---

## Default Folder Template Settings

Project Toolkit creates this starter file automatically if it does not exist:

```json
{
  "presets": [
    {
      "name": "Module Folders",
      "description": "Default modular project folders.",
      "askModuleName": true,
      "folders": [
        "DTO",
        "Models",
        "Repositories",
        "Features",
        "Features/Commands",
        "Features/Queries",
        "Services",
        "Cache",
        "Enums"
      ]
    },
    {
      "name": "CQRS Folders",
      "description": "Create Commands and Queries folders inside the selected folder.",
      "askModuleName": false,
      "folders": [
        "Commands",
        "Queries"
      ]
    }
  ]
}
```

---

## How Folder Templates Work

Each item in `presets` is one folder template.

```json
{
  "name": "Module Folders",
  "description": "Default modular project folders.",
  "askModuleName": true,
  "folders": [
    "DTO",
    "Models",
    "Repositories",
    "Features/Commands",
    "Features/Queries"
  ]
}
```

### `name`

The display name shown in the preset picker.

```json
"name": "Module Folders"
```

### `description`

A short explanation shown next to the preset.

```json
"description": "Default modular project folders."
```

### `askModuleName`

Controls whether Project Toolkit asks for a root folder name.

```json
"askModuleName": true
```

If `true`, Project Toolkit asks for a name such as:

```text
product
```

Then it creates:

```text
Product/
├── DTO/
├── Models/
├── Repositories/
└── Features/
```

If `false`, folders are created directly inside the selected folder.

```json
"askModuleName": false
```

Example:

```json
{
  "name": "CQRS Folders",
  "description": "Create Commands and Queries folders inside the selected folder.",
  "askModuleName": false,
  "folders": [
    "Commands",
    "Queries"
  ]
}
```

If you right-click:

```text
Features/
```

Project Toolkit creates:

```text
Features/
├── Commands/
└── Queries/
```

### `folders`

The list of folders to create.

```json
"folders": [
  "DTO",
  "Models",
  "Features/Commands",
  "Features/Queries"
]
```

Nested folders are supported with `/`.

---

## Folder Template Example

Preset:

```json
{
  "name": "Vertical Slice Module",
  "description": "Create a vertical slice module structure.",
  "askModuleName": true,
  "folders": [
    "DTO",
    "Models",
    "Repositories",
    "Features",
    "Features/Commands",
    "Features/Queries",
    "Services",
    "Enums"
  ]
}
```

Usage:

1. Right-click your project folder.
2. Select **Project Toolkit > Create Module Folders**.
3. Select **Vertical Slice Module**.
4. Enter:

```text
customer
```

Result:

```text
Customer/
├── DTO/
├── Models/
├── Repositories/
├── Features/
│   ├── Commands/
│   └── Queries/
├── Services/
└── Enums/
```

---

# File Templates

File Templates let you generate files from custom templates.

File templates are stored here:

```text
.vscode/Project Toolkit/File Templates/
```

To open this folder quickly:

```text
Command Palette > Project Toolkit: Open File Templates
```

Each file template has its own folder:

```text
.vscode/Project Toolkit/File Templates/
└── sample-csharp-class/
    ├── template.json
    └── Class.cs.tpl
```

---

## Default File Template

Project Toolkit creates a starter file template automatically if it does not exist.

### `template.json`

```json
{
  "name": "Sample C# Class",
  "description": "Create a simple C# class.",
  "inputs": [
    {
      "name": "className",
      "label": "Class name",
      "default": "ProductService"
    }
  ],
  "vars": {
    "class": "{{className|pascal}}"
  },
  "files": [
    {
      "path": "{{class}}.cs",
      "source": "Class.cs.tpl",
      "open": true,
      "overwrite": false
    }
  ]
}
```

### `Class.cs.tpl`

```csharp
namespace {{file.namespace}};

public sealed class {{class}}
{
}
```

Usage:

1. Right-click a folder.
2. Select **Project Toolkit > Create File From Template**.
3. Select **Sample C# Class**.
4. Enter:

```text
product service
```

Result:

```csharp
namespace YourProject.SomeFolder;

public sealed class ProductService
{
}
```

---

## File Template Structure

A file template folder must contain:

```text
template-name/
├── template.json
└── your-template-file.tpl
```

Example:

```text
repository/
├── template.json
└── Repository.cs.tpl
```

---

## `template.json` Fields

### `name`

The template display name.

```json
"name": "Repository"
```

### `description`

Short explanation shown in the template picker.

```json
"description": "Create a repository class."
```

### `inputs`

Inputs are values requested from the user.

```json
"inputs": [
  {
    "name": "entityName",
    "label": "Entity name",
    "default": "Product"
  }
]
```

If the user enters:

```text
product
```

You can use it as:

```text
{{entityName}}
```

---

### `vars`

`vars` lets you create reusable variables.

```json
"vars": {
  "entity": "{{entityName|pascal}}",
  "repository": "{{entity}}Repository"
}
```

Then use:

```text
{{entity}}
{{repository}}
```

This keeps templates clean and avoids repeating long expressions.

---

### `files`

The `files` array defines generated files.

```json
"files": [
  {
    "path": "{{repository}}.cs",
    "source": "Repository.cs.tpl",
    "open": true,
    "overwrite": false
  }
]
```

### `path`

The output file path relative to the folder you right-clicked.

```json
"path": "{{repository}}.cs"
```

Nested output paths are supported:

```json
"path": "Repositories/{{repository}}.cs"
```

### `source`

The template source file.

```json
"source": "Repository.cs.tpl"
```

### `open`

If `true`, the generated file opens automatically.

```json
"open": true
```

### `overwrite`

If `false`, Project Toolkit asks before overwriting existing files.

```json
"overwrite": false
```

---

## Template Variables

Project Toolkit supports variables with this syntax:

```text
{{variableName}}
```

Example:

```csharp
public sealed class {{class}}
{
}
```

---

## Project Variables

```text
{{project.rootNamespace}}
```

The root namespace is detected from the nearest `.csproj` file when possible.

If no `.csproj` is found, the workspace name is used.

---

## Target Folder Variables

The target folder is the folder you right-clicked.

```text
{{target.path}}
{{target.relative}}
{{target.namespace}}
{{target.rootNamespace}}
{{target.moduleNamespace}}
```

Example:

If you right-click:

```text
ProjectA/Customers/Addresses/Repositories
```

Then:

```text
{{target.namespace}}       -> ProjectA.Customers.Addresses.Repositories
{{target.moduleNamespace}} -> ProjectA.Customers.Addresses
```

---

## Generated File Variables

These variables are available while rendering each generated file:

```text
{{file.path}}
{{file.relative}}
{{file.directory}}
{{file.name}}
{{file.nameNoExtension}}
{{file.extension}}
{{file.namespace}}
{{file.rootNamespace}}
{{file.moduleNamespace}}
```

Example:

If Project Toolkit creates:

```text
ProjectA/Customers/Addresses/Repositories/AddressRepository.cs
```

Then:

```text
{{file.name}}            -> AddressRepository.cs
{{file.nameNoExtension}} -> AddressRepository
{{file.namespace}}       -> ProjectA.Customers.Addresses.Repositories
{{file.moduleNamespace}} -> ProjectA.Customers.Addresses
{{file.rootNamespace}}   -> ProjectA
```

This is useful for imports:

```csharp
using {{file.moduleNamespace}}.DTO;
using {{file.moduleNamespace}}.Models;

namespace {{file.namespace}};
```

Generated result:

```csharp
using ProjectA.Customers.Addresses.DTO;
using ProjectA.Customers.Addresses.Models;

namespace ProjectA.Customers.Addresses.Repositories;
```

---

## Template Transforms

Transforms are applied with the pipe syntax:

```text
{{value|transform}}
```

Examples:

```text
{{entityName|pascal}}
{{entityName|camel}}
{{entityName|snake}}
{{entityName|kebab}}
```

Available transforms:

| Transform                | Example Input       | Output            |
| ------------------------ | ------------------- | ----------------- |
| `pascal`                 | `product service`   | `ProductService`  |
| `camel`                  | `product service`   | `productService`  |
| `kebab`                  | `ProductService`    | `product-service` |
| `snake`                  | `ProductService`    | `product_service` |
| `lower`                  | `Product`           | `product`         |
| `upper`                  | `Product`           | `PRODUCT`         |
| `trim`                   | `Product`           | `Product`         |
| `plural`                 | `Category`          | `Categories`      |
| `stripLastPascal`        | `ProductRepository` | `Product`         |
| `stripSuffix:Repository` | `ProductRepository` | `Product`         |

---

## Repository Template Example

Folder:

```text
.vscode/Project Toolkit/File Templates/repository/
├── template.json
└── Repository.cs.tpl
```

### `template.json`

```json
{
  "name": "Repository",
  "description": "Create a repository class.",
  "inputs": [
    {
      "name": "entityName",
      "label": "Entity name",
      "default": "Product"
    }
  ],
  "vars": {
    "entity": "{{entityName|pascal}}",
    "repository": "{{entity}}Repository"
  },
  "files": [
    {
      "path": "{{repository}}.cs",
      "source": "Repository.cs.tpl",
      "open": true,
      "overwrite": false
    }
  ]
}
```

### `Repository.cs.tpl`

```csharp
using {{file.moduleNamespace}}.DTO;
using {{file.moduleNamespace}}.Models;

namespace {{file.namespace}};

public sealed class {{repository}}
{
    public Task<{{entity}}?> GetByIdAsync(int id, CancellationToken ct)
    {
        throw new NotImplementedException();
    }
}
```

Usage:

Right-click:

```text
ProjectA/Customers/Addresses/Repositories
```

Enter:

```text
Address
```

Generated file:

```text
ProjectA/Customers/Addresses/Repositories/AddressRepository.cs
```

Generated code:

```csharp
using ProjectA.Customers.Addresses.DTO;
using ProjectA.Customers.Addresses.Models;

namespace ProjectA.Customers.Addresses.Repositories;

public sealed class AddressRepository
{
    public Task<Address?> GetByIdAsync(int id, CancellationToken ct)
    {
        throw new NotImplementedException();
    }
}
```

---

## CQRS Query Template Example

Folder:

```text
.vscode/Project Toolkit/File Templates/cqrs-query/
├── template.json
└── Query.cs.tpl
```

### `template.json`

```json
{
  "name": "CQRS Query",
  "description": "Create a query and handler.",
  "inputs": [
    {
      "name": "queryName",
      "label": "Query name",
      "default": "GetProduct"
    },
    {
      "name": "resultType",
      "label": "Result type",
      "default": "ProductDTO"
    }
  ],
  "vars": {
    "query": "{{queryName|pascal}}",
    "result": "{{resultType}}"
  },
  "files": [
    {
      "path": "{{query}}.cs",
      "source": "Query.cs.tpl",
      "open": true,
      "overwrite": false
    }
  ]
}
```

### `Query.cs.tpl`

```csharp
using {{file.rootNamespace}}.Blocks.CoreEntities;
using {{file.rootNamespace}}.Blocks.CQRS;
using {{file.moduleNamespace}}.DTO;
using {{file.moduleNamespace}}.Repositories;

namespace {{file.namespace}};

public record {{query}}() : IQuery<{{result}}>;

public sealed class {{query}}Handler()
    : IQueryHandler<{{query}}, {{result}}>
{
    public async Task<APIResult<{{result}}?>> Handle(
        {{query}} query,
        CancellationToken ct)
    {
        APIResult<{{result}}?> res = new();

        return res;
    }
}
```

Usage:

Right-click:

```text
ProjectA/Products/Features/Queries
```

Enter:

```text
Query name: GetProduct
Result type: ProductDTO
```

Generated file:

```text
ProjectA/Products/Features/Queries/GetProduct.cs
```

---

## Creating Multiple Files From One Template

A single template can generate multiple files.

Example:

```json
{
  "name": "Repository With Interface",
  "description": "Create repository interface and implementation.",
  "inputs": [
    {
      "name": "entityName",
      "label": "Entity name",
      "default": "Product"
    }
  ],
  "vars": {
    "entity": "{{entityName|pascal}}",
    "repository": "{{entity}}Repository",
    "interface": "I{{entity}}Repository"
  },
  "files": [
    {
      "path": "{{interface}}.cs",
      "source": "RepositoryInterface.cs.tpl",
      "open": true,
      "overwrite": false
    },
    {
      "path": "{{repository}}.cs",
      "source": "Repository.cs.tpl",
      "open": true,
      "overwrite": false
    }
  ]
}
```

---

# Focus Folder

Focus Folder temporarily hides unrelated files and folders in the Explorer.

It is useful when working in large projects.

Example workspace:

```text
ProjectA/
├── Customers/
├── Products/
├── Orders/
├── ProjectA.API/
└── ProjectA.Blocks/
```

If you focus:

```text
ProjectA/Customers
```

The Explorer temporarily shows only the focused path.

Focus Folder does **not** change the VS Code workspace root.

It works by temporarily updating:

```text
files.exclude
```

When you exit focus mode, Project Toolkit restores the previous state.

---

## How to Use Focus Folder

1. Right-click a folder in the Explorer.
2. Select **Project Toolkit > Focus Folder**.
3. Work inside the focused folder.
4. Select **Exit Focus Folder** to restore normal Explorer visibility.

You can also use the Explorer title button while focus mode is active.

---

## Reset Focus Folder

If Explorer visibility does not restore correctly, run:

```text
Command Palette > Project Toolkit: Reset Focus Folder
```

This removes Project Toolkit focus rules and restores normal visibility.

---

# Recommended Use Cases

Project Toolkit is useful for:

* Modular monoliths
* Vertical Slice Architecture
* CQRS projects
* .NET projects
* Flutter projects
* Node.js projects
* Large workspaces
* Teams that want consistent folder and file structures

---