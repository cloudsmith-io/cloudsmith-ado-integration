# Automated Release Setup

The release workflow builds and publishes the Azure DevOps extension when a semantic version tag is pushed.

## Required configuration

Configure the following under **Settings > Secrets and variables > Actions**.

| Type | Name | Purpose |
| --- | --- | --- |
| Variable | `AZURE_DEVOPS_PUBLISHER_ID` | Azure DevOps Marketplace publisher ID, normally `Cloudsmith` |
| Secret | `AZURE_DEVOPS_PAT` | Marketplace publishing token with the `Marketplace (Publish)` scope |

## Version and compatibility rules

Before tagging a release, the following versions must match:

- `vss-extension.json` → `version`
- `cloudsmith-task/task.json` → `version.Major`, `version.Minor`, and `version.Patch`
- `cloudsmith-task/package.json` → `version`
- The Git tag without its leading `v`

Do not change the extension publisher, extension ID, task GUID, or task name. These stable identifiers allow existing pipelines to continue resolving their selected task major.

Version 1 source is maintained on the `v1` branch. Pipelines using `CloudsmithCliSetupAndAuthenticate@1` remain on that major; publishing version 2 does not require users to migrate automatically.

## Release process

1. Update the extension, task, and package versions.
2. Update `CHANGELOG.md` and the migration documentation.
3. Run the test suite and package the extension locally.
4. Commit and merge the release changes.
5. Create and push the matching semantic version tag.

For example, for version `2.0.0`:

```bash
cd cloudsmith-task
npm ci
npm test
cd ..
npx tfx-cli extension create --manifest-globs vss-extension.json --output-path dist/

git tag v2.0.0
git push origin v2.0.0
```

The workflow then:

1. Confirms the tag, extension manifest, task manifest, and package versions match.
2. Runs the unit and public-contract tests.
3. Confirms that the `v1` maintenance branch exists for a version 2 or later release.
4. Builds and publishes the VSIX to the Azure DevOps Marketplace.
5. Creates a GitHub release with the VSIX attached.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Version mismatch | Align all three manifests with the Git tag. |
| Contract test failure | Restore the stable extension/task identity or document and plan a new major. |
| Missing `v1` branch | Restore the version 1 maintenance branch before releasing version 2 or later. |
| Marketplace authentication failure | Confirm `AZURE_DEVOPS_PAT` is current and has `Marketplace (Publish)` scope. |
| Publisher mismatch | Confirm `AZURE_DEVOPS_PUBLISHER_ID` matches the manifest publisher. |
