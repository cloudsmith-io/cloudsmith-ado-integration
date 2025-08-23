# Cloudsmith CLI Installer for Azure DevOps Pipelines

## Overview

This extension allows Azure DevOps pipelines to easily install and authenticate the [Cloudsmith CLI](https://cloudsmith.com/). The Cloudsmith CLI provides powerful command-line tools to manage packages, repositories, and various artifact types on Cloudsmith.

With this extension, you can:

- Install the Cloudsmith CLI directly in your CI/CD pipelines.
- Install the Cloudsmith CLI via pip (`pipInstall`) instead of the default zipapp installer.
- Authenticate using either an API Key or OpenID Connect (OIDC).
- Authenticate only via OIDC without installing the CLI (`oidcAuthOnly`).


## Features

- **Cloudsmith CLI Installation**: Easily install the latest or a specific version of the Cloudsmith CLI in your Azure DevOps pipeline. Install via zipapp or pip, with optional version specification.
- **Authentication**: Choose between API Key authentication or OIDC authentication. Use the `oidcAuthOnly` option to authenticate only via OIDC without installing the CLI.
- **Customizable**: Choose your installation method (pip or zipapp) and specify the version of the Cloudsmith CLI, or use the latest by default.

## Getting Started

1. Add this task to your Azure DevOps pipeline.
2. Choose your authentication method (API Key or OIDC). 
   - If using **API Key** authentication, you must provide the `apiKey`.
   - If using **OIDC** authentication, you must provide the `clientId`, `clientSecret`, `appIdUri`, `tenantId`, `oidcNamespace` and `oidcServiceSlug`.
   - If using **OIDC Auth Only** (`oidcAuthOnly`), the task will skip installing the CLI and only perform OIDC authentication.
3. Optionally, specify the Cloudsmith CLI version you want to install.
   - If using **pipInstall**, the CLI will be installed from PyPI via pip. You can still specify a version with `cliVersion`.
4. Enjoy seamless integration with Cloudsmith for managing your artifacts.

### Example YAML Configuration

Below is an example of how to use the Cloudsmith CLI Installer in your Azure DevOps pipeline YAML:

```yaml
jobs:
  - job: InstallCloudsmith
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    # Install and Authenticate with Cloudsmith CLI
    - task: CloudsmithCliInstallAndAuthenticate
      inputs:
        cliVersion: '1.3.1'  # Optional: Specify Cloudsmith CLI version to install (Leave empty to install the latest version)
        oidcAuthOnly: false   # Set to true to skip installation and authenticate only via OIDC
        pipInstall: false     # Set to true to install via pip instead of zipapp
        authMethod: 'apiKey' # Choose 'apiKey' for API Key authentication or 'oidc' for OIDC authentication
        apiKey: '$(CLOUDSMITH_API_KEY)'  # Only required if using 'apiKey' authentication
        clientId: '$(YOUR_CLIENT_ID)' # Required if authMethod is set to 'oidc'. This is the Client ID from your Azure AD application used for OIDC authentication.
        clientSecret: '$(YOUR_CLIENT_SECRET)' # Required if authMethod is set to 'oidc'. This is the Client Secret associated with the Azure AD application.
        appIdUri: '$(YOUR_APP_ID_URI)'  # Required if authMethod is set to 'oidc'. This is the Application ID URI of your Azure AD application. Make sure to include the full URI.
        tenantId: '$(YOUR_TENANT_ID)'  # Required if authMethod is set to 'oidc'. This is the Tenant ID for your Azure AD, which identifies your Azure AD instance.
        oidcNamespace: '$(your-namespace)'  # Only required if using OIDC authentication
        oidcServiceSlug: '$(your-service-slug)'  # Optional: Provide if needed for OIDC authentication


    # Example Cloudsmith push
    - script: |
        cloudsmith push raw $(CLOUDSMITH_ORG)/$(CLOUDSMITH_REPO) my-package.zip
      displayName: 'Push package to Cloudsmith'
```

## Support
If you encounter any issues or need help, feel free to reach out to us via the Cloudsmith support team at [support@cloudsmith.io](mailto:support@cloudsmith.io).