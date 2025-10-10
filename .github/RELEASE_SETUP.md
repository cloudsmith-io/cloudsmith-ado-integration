# 🚀 Automated Release Setup

This repository uses GitHub Actions to automatically build and publish the Azure DevOps extension when a new version tag is pushed.

## 📋 Required Setup

### 1. Repository Variables
Go to **Settings** → **Secrets and variables** → **Actions** → **Variables** tab:

- **`AZURE_DEVOPS_PUBLISHER_ID`**: Your Azure DevOps Marketplace publisher ID (e.g., `Cloudsmith`)

### 2. Repository Secrets  
Go to **Settings** → **Secrets and variables** → **Actions** → **Secrets** tab:

- **`AZURE_DEVOPS_PAT`**: Personal Access Token for Azure DevOps Marketplace
  - Scopes required: **Marketplace (Publish)**
  - Get it from: https://dev.azure.com/_usersSettings/tokens

## 🏗️ How It Works

### Automatic Release Process:
1. **Tag Push**: Push a version tag like `v1.1.0`
2. **Build**: GitHub Actions builds the extension using `tfx extension create`  
3. **Validate**: Ensures tag version matches `vss-extension.json` version
4. **Publish**: Publishes to Azure DevOps Marketplace using `tfx extension publish`
5. **Release**: Creates GitHub release with VSIX file attached

### Usage:
```bash
# 1. Update version in vss-extension.json and task.json
# 2. Commit changes
git add .
git commit -m "chore: bump version to 1.1.0"

# 3. Create and push tag
git tag v1.1.0
git push origin v1.1.0

# 4. GitHub Actions will automatically:
#    - Build the .vsix file
#    - Publish to marketplace  
#    - Create GitHub release
```

## 📁 Files Involved

- **`.github/workflows/release.yml`**: Main workflow file
- **`vss-extension.json`**: Extension manifest (version must match tag)
- **`cloudsmith-task/task.json`**: Task definition (version must match tag)
- **`cloudsmith-task/package.json`**: Node.js dependencies

## 🔍 Workflow Features

- ✅ **Version Validation**: Ensures tag matches manifest version
- ✅ **Dependency Installation**: Installs npm dependencies
- ✅ **Extension Build**: Creates `.vsix` file using TFX CLI
- ✅ **Marketplace Publish**: Publishes to Azure DevOps Marketplace
- ✅ **GitHub Release**: Creates release with VSIX download
- ✅ **Release Notes**: Auto-generates release notes
- ✅ **Build Summary**: Provides detailed build information

## 🐛 Troubleshooting

### Common Issues:
1. **Version Mismatch**: Ensure tag version matches `vss-extension.json` version
2. **PAT Expired**: Update `AZURE_DEVOPS_PAT` secret with fresh token
3. **Publisher ID**: Verify `AZURE_DEVOPS_PUBLISHER_ID` variable is correct
4. **Node Dependencies**: Check `cloudsmith-task/package.json` for issues

### Debug Steps:
1. Check **Actions** tab for detailed logs
2. Verify all secrets and variables are set
3. Ensure PAT has **Marketplace (Publish)** scope
4. Validate JSON syntax in manifest files