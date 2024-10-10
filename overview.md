# Cloudsmith CLI Installer for Azure DevOps Pipelines

## Overview
This extension allows Azure DevOps pipelines to easily install the [Cloudsmith CLI](https://cloudsmith.com/). The Cloudsmith CLI provides powerful command-line tools to manage packages, repositories, and various artifact types on Cloudsmith.

With this extension, you can:
- Install the Cloudsmith CLI directly in your CI/CD pipelines.
- Specify the version of the CLI to install, or allow it to install the latest version automatically.

## Features
- **Cloudsmith CLI Installation**: Easily install the latest or a specific version of the Cloudsmith CLI in your Azure DevOps pipeline.
- **Customizable Versioning**: Optionally specify the version of the Cloudsmith CLI to ensure compatibility with your environment.

## Getting Started
1. Add this task to your Azure DevOps pipeline.
2. Optionally, specify the Cloudsmith CLI version you want to install.
3. Use the installed CLI to manage your Cloudsmith repositories and artifacts.

For more detailed instructions, check out the [Cloudsmith CLI documentation](https://help.cloudsmith.io/docs/welcome-to-cloudsmith-docs).

### Example YAML Configuration
```yaml
steps:
- task: cloudsmith-cli-task@1
  displayName: 'Install Cloudsmith CLI'
  inputs:
    cloudsmithCliVersion: 'latest'  # Specify a version or leave empty for latest
```
## Support
If you encounter any issues or need help, feel free to reach out to us via the Cloudsmith support team at [support@cloudsmith.io](mailto:support@cloudsmith.io).