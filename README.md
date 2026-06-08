# Project Toolkit

**Project Toolkit** is a VS Code extension which I made for myself. I hope it helps to you. If you need other features, please create issue.

It provides three main features:

* Create folder structures from editable workspace presets
* Generate files from custom workspace templates
* Focus on a specific folder in the Explorer

Project Toolkit does not include default templates. Developer can define own folder and file templates inside `.vscode/Project Toolkit`.

---

## Features

### 1. Create Folders

Create a full folder structure from a preset.

Example:

```text
Products/
├── DTO/
├── Models/
├── Repositories/
├── Features/
│   ├── Commands/
│   └── Queries/
├── Services/
├── Cache/
└── Enums/
```

Folder presets are defined by the project, so each team can customize its own structure.

---

### 2. Create File From Template

Generate files from custom templates.

Templates support variables such as:

```text
{{file.name}}
{{file.nameNoExtension}}
{{file.namespace}}
{{file.rootNamespace}}
{{file.moduleNamespace}}
{{target.namespace}}
{{project.rootNamespace}}
```

Templates also support transforms:

```text
{{name|pascal}}
{{name|camel}}
{{name|kebab}}
{{name|snake}}
{{name|lower}}
{{name|upper}}
{{name|plural}}
{{name|stripLastPascal}}
{{name|stripSuffix:Repository}}
```

This makes templates readable and easy to maintain.

---

### 3. Focus Folder

Focus on a selected folder in the VS Code Explorer.

This is useful when working inside a large project or modular monolith.

Example:

```text
ProjectA/
├── Products/
├── Customers/
├── Orders/
ProjectA.API/
ProjectA.Blocks/
```

If you focus `ProjectA/Products`, the Explorer temporarily hides other folders and shows only the focused path.

---

## Workspace Configuration

Project Toolkit reads all project-specific settings from:

```text
.vscode/Project Toolkit/
```

Example structure:

```text
.vscode/
└── Project Toolkit/
    ├── Folder Templates/
    │   └── settings.json
    └── File Templates/
        ├── cqrs-query/
        │   ├── template.json
        │   └── Query.cs.tpl
        └── repository/
            ├── template.json
            └── Repository.cs.tpl
```

---

## Folder Templates

Folder presets are stored in:

```text
.vscode/Project Toolkit/Folder Templates/settings.json
```

Example:

```json
{
  "presets": [
    {
      "name": "Module Folders",
      "description": "Default vertical slice module folders.",
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

### Options

#### `name`

The display name of the folder preset.

```json
"name": "Module Folders"
```

#### `description`

A short description shown in the template picker.

```json
"description": "Default vertical slice module folders."
```

#### `askModuleName`

If `true`, Project Toolkit asks for a name and creates a root folder with that name.

```json
"askModuleName": true
```

Example input:

```text
product
```

Result:

```text
Product/
├── DTO/
├── Models/
└── Repositories/
```

If `false`, folders are created directly inside the selected folder.

```json
"askModuleName": false
```

#### `folders`

The list of folders to create.

```json
"folders": [
  "DTO",
  "Models",
  "Features/Commands",
  "Features/Queries"
]
```

---

## File Templates

File templates are stored in:

```text
.vscode/Project Toolkit/File Templates/
```

Each template has its own folder:

```text
.vscode/Project Toolkit/File Templates/cqrs-query/
├── template.json
└── Query.cs.tpl
```

---

## Example File Template

### `template.json`

```json
{
  "name": "CQRS Query",
  "description": "Create a CQRS query and handler file.",
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

---

## Generated Example

If you right-click:

```text
ProjectA/Products/Features/Queries
```

and enter:

```text
Query name: GetProduct
Result type: ProductDTO
```

Project Toolkit creates:

```text
ProjectA/Products/Features/Queries/GetProduct.cs
```

Generated file:

```csharp
using ProjectA.Blocks.CoreEntities;
using ProjectA.Blocks.CQRS;
using ProjectA.Products.DTO;
using ProjectA.Products.Repositories;

namespace ProjectA.Products.Features.Queries;

public record GetProduct() : IQuery<ProductDTO>;

public sealed class GetProductHandler()
    : IQueryHandler<GetProduct, ProductDTO>
{
    public async Task<APIResult<ProductDTO?>> Handle(
        GetProduct query,
        CancellationToken ct)
    {
        APIResult<ProductDTO?> res = new();

        return res;
    }
}
```

---

## Template Variables

### Project Variables

```text
{{project.rootNamespace}}
```

The root namespace detected from the nearest `.csproj` file when possible.

---

### Target Folder Variables

The target folder is the folder you right-clicked.

```text
{{target.path}}
{{target.relative}}
{{target.namespace}}
{{target.rootNamespace}}
{{target.moduleNamespace}}
```

---

### Generated File Variables

Available while rendering file content:

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

```csharp
namespace {{file.namespace}};
```

---

## Template Transforms

Transforms can be applied with the pipe syntax:

```text
{{variable|transform}}
```

Examples:

```text
{{entityName|pascal}}
{{entityName|camel}}
{{entityName|snake}}
{{entityName|kebab}}
```

Available transforms:

| Transform                |       Example Input |         Output |
| ------------------------ | ------------------: | -------------: |
| `pascal`                 |      `product item` |  `ProductItem` |
| `camel`                  |      `product item` |  `productItem` |
| `kebab`                  |       `ProductItem` | `product-item` |
| `snake`                  |       `ProductItem` | `product_item` |
| `lower`                  |           `Product` |      `product` |
| `upper`                  |           `Product` |      `PRODUCT` |
| `plural`                 |          `Category` |   `Categories` |
| `stripLastPascal`        | `ProductRepository` |      `Product` |
| `stripSuffix:Repository` | `ProductRepository` |      `Product` |

---

## Creating Multiple Files From One Template

A single template can create multiple files.

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

## Usage

### Create Folders

1. Right-click a folder in the Explorer.
2. Select **Project Toolkit**.
3. Select **Create Module Folders**.
4. Choose a folder preset.
5. Enter the module name if required.

---

### Create File From Template

1. Right-click the folder where the file should be created.
2. Select **Project Toolkit**.
3. Select **Create File From Template**.
4. Choose a template.
5. Fill in the requested inputs.

---

### Focus Folder

1. Right-click a folder in the Explorer.
2. Select **Project Toolkit**.
3. Select **Focus Folder**.
4. Work inside the focused folder.
5. Select **Exit Focus Folder** to restore normal Explorer visibility.

If something goes wrong during focus mode, run:

```text
Command Palette > Project Toolkit: Reset Focus Folder
```

---

## Notes

* Project Toolkit does not include default templates.
* Templates are stored per workspace.
* Folder templates and file templates are editable by the project/team.
* File templates can create one or more files.
* Folder presets can create folders directly or inside a named module folder.

---

## Recommended Use Cases

Project Toolkit is useful for:

* Modular monoliths
* Vertical Slice Architecture
* CQRS projects
* .NET projects
* Node.js projects
* Flutter projects
* Frontend projects
* Large workspaces
* Teams that want consistent file and folder structures

---