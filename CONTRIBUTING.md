# Contributing

Thank you for contributing to the Cloudsmith Azure DevOps integration.

## Public contract

The Marketplace extension and task identities allow existing pipelines to resolve the correct task major. Do not change these values:

| File | Field | Stable value |
| --- | --- | --- |
| `vss-extension.json` | `publisher` | `Cloudsmith` |
| `vss-extension.json` | `id` | `CloudsmithCliSetupAndAuthenticate` |
| `cloudsmith-task/task.json` | `id` | `06C63887-BA6C-4F36-8BB5-34A817634C29` |
| `cloudsmith-task/task.json` | `name` | `CloudsmithCliSetupAndAuthenticate` |

The `cliVersion`, `authMethod`, `oidcNamespace`, `oidcServiceSlug`, and `apiKey` input names are also part of the migration contract. Changes to their meaning require a new task major and a migration guide.

Version 1 remains on the `v1` branch. Version 2 intentionally does not include the removed `pipInstall` and `oidcAuthOnly` compatibility paths.

## Prerequisites

- Node.js 20
- npm
- [Azure DevOps Extension CLI (`tfx-cli`)](https://github.com/microsoft/tfs-cli), when packaging the extension

## Repository layout

- `cloudsmith-task/main.js` contains the Azure Pipelines task handler.
- `cloudsmith-task/task.json` defines the public inputs, outputs, and task version.
- `cloudsmith-task/installer/` contains synchronized Cloudsmith CLI installer scripts.
- `tests/` contains unit, platform-behaviour, security, and public-contract tests.
- `vss-extension.json` defines the Marketplace extension.

## Local development

Install dependencies and run the checks:

```bash
cd cloudsmith-task
npm ci
node --check main.js
npm test
```

Do not use real API keys, PATs, or OIDC tokens in local tests. The test suite uses fake installers and credentials and must not contact Cloudsmith or Azure DevOps.

## Package the extension

From the repository root:

```bash
npx tfx-cli extension create \
  --manifest-globs vss-extension.json \
  --output-path dist/
```

Inspect the generated VSIX before publishing and confirm it contains `main.js`, `task.json`, and both installer scripts.

## Pull requests

1. Create a branch from `main`.
2. Make a focused change and update the relevant documentation.
3. Run the local checks and package the extension when task contents change.
4. Describe user-visible behaviour, migration impact, and validation in the pull request.

Use Conventional Commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, `ci:`, and `chore:`. Use `feat!:` for a breaking task change.

## Releases

See [Automated Release Setup](.github/RELEASE_SETUP.md) for version alignment, tagging, and publishing instructions.

## License

This project is available under the [Apache License 2.0](LICENSE).
