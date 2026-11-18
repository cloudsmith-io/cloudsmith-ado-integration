# Automated Release Setup

The release workflow builds and publishes the Azure DevOps extension when a change to `CHANGELOG.md` reaches `main` and the newest version in `CHANGELOG.md` has no GitHub release. A pushed semantic version tag also starts the workflow.

## Required configuration

Configure the following under **Settings > Secrets and variables > Actions**.

| Type | Name | Purpose |
| --- | --- | --- |
| Variable | `AZURE_DEVOPS_PUBLISHER_ID` | Azure DevOps Marketplace publisher ID, normally `Cloudsmith` |
| Secret | `AZURE_DEVOPS_PAT` | Marketplace publishing token with the `Marketplace (Publish)` scope |
| Secret | `DOWNSTREAM_RELEASE_PUSH_TOKEN` | Cloudsmith Bot token with `Contents: write` that opens and merges the Cloudsmith CLI bump pull requests |
| Secret | `CLOUDSMITH_BOT_SSH_KEY` | Private SSH key that signs the commits of Cloudsmith Bot |

## Version and compatibility rules

Before releasing, the following versions must match:

- `vss-extension.json` → `version`
- `cloudsmith-task/task.json` → `version.Major`, `version.Minor`, and `version.Patch`
- `cloudsmith-task/package.json` → `version`
- The newest version in `CHANGELOG.md`

Do not change the extension publisher, extension ID, task GUID, or task name. These stable identifiers allow existing pipelines to continue resolving their selected task major.

Version 1 source is maintained on the `v1` branch. Pipelines using `CloudsmithCliSetupAndAuthenticate@1` remain on that major; publishing version 2 does not require users to migrate automatically.

## Release process

1. Update the extension, task, and package versions.
2. Add the version to `CHANGELOG.md` and update the migration documentation.
3. Run the test suite and package the extension locally.
4. Commit and merge the release changes.

For example:

```bash
cd cloudsmith-task
npm ci
npm test
cd ..
npx tfx-cli extension create --manifest-globs vss-extension.json --output-path dist/
```

The workflow then:

1. Confirms the release, extension manifest, task manifest, and package versions match.
2. Runs the unit and public-contract tests.
3. Confirms that the `v1` maintenance branch exists for a version 2 or later release.
4. Builds and publishes the VSIX to the Azure DevOps Marketplace.
5. Creates the tag and a GitHub release with the VSIX attached.

## Cloudsmith CLI updates

The `cliVersion` input defaults to a pinned Cloudsmith CLI version. Each Cloudsmith CLI release sends the `cloudsmith-cli-release` event to this repository. The bump workflow then runs `scripts/bump-cli-version.js`, which pins the new CLI version, increments the extension version, and adds a `CHANGELOG.md` section. Cloudsmith Bot opens the pull request and merges it when the checks pass. The merge starts the release workflow.

The script ignores a CLI release with a different major version. A new CLI major version needs a new task major version. To pin a version by hand, run the bump workflow with the `version` input.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Version mismatch | Align all three manifests with the newest version in `CHANGELOG.md`. |
| Contract test failure | Restore the stable extension/task identity or document and plan a new major. |
| Missing `v1` branch | Restore the version 1 maintenance branch before releasing version 2 or later. |
| Marketplace authentication failure | Confirm `AZURE_DEVOPS_PAT` is current and has `Marketplace (Publish)` scope. |
| Publisher mismatch | Confirm `AZURE_DEVOPS_PUBLISHER_ID` matches the manifest publisher. |
