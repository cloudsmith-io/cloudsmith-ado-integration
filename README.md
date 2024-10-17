# Cloudsmith CLI Install & Authenticate Task for Azure DevOps

This Azure DevOps extension provides a task for installing the Cloudsmith CLI and authenticating with Cloudsmith using API Key or OpenID Connect (OIDC). This task integrates seamlessly into your Azure DevOps pipelines, making it easier to install the Cloudsmith CLI and authenticate for your package management tasks.

## Features

- **Install Cloudsmith CLI**: Install the latest or a specific version of the Cloudsmith CLI.
- **Authenticate with API Key or OIDC**: Securely authenticate with Cloudsmith to manage packages within your pipeline.
- **Seamless Integration**: Integrates directly into Azure DevOps Pipelines for automated tasks.

## Usage in Azure DevOps Pipelines

Once the extension is installed, you can use it in your Azure DevOps pipelines by adding it to your pipeline YAML. Below is an example:

   ```bash
   jobs:
    - job: InstallCloudsmithAndAuthenticate
  pool:
    vmImage: 'ubuntu-latest' #Modify Accordingly
  steps:
  # Install and Authenticate with Cloudsmith CLI
  - task: CloudsmithCliInstallAndAuthenticate@0
    inputs:
      authMethod: 'apiKey'          # Choose 'apiKey' for API Key authentication or 'oidc' for OIDC authentication
      apiKey: '$(CLOUDSMITH_API_KEY)'  # Only required if using 'apiKey' authentication
      oidcNamespace: '$(your-namespace)'  # Only required if using OIDC authentication
      oidcServiceSlug: '$(your-service-slug)'  # Optional: Provide if needed for OIDC authentication
      cliVersion: '1.3.1'  # Optional: Specify Cloudsmith CLI version to install (Leave empty to install the latest version)

  # Push a package to Cloudsmith
  - script: |
      cloudsmith whoami  # Verifies the authentication is successful
      cloudsmith push raw $(CLOUDSMITH_ORG)/$(CLOUDSMITH_REPO) my-package.zip
    displayName: 'Push package to Cloudsmith'
   ```

## Authentication
There are two supported authentication methods: **API Key** and **OIDC**. You need to configure authentication before interacting with Cloudsmith.

**API Key Authentication**:
   To use API Key authentication, simply provide your Cloudsmith API key. You can authenticate with Cloudsmith using your API Key by setting it as an environment variable or directly in the pipeline. To keep your API Key secure, we recommend setting it as an environment variable in Azure DevOps.

   ```yaml
   authMethod: 'apiKey'
   apiKey: '$(CLOUDSMITH_API_KEY)'
   ```

**OIDC Authentication**:
   To authenticate via OIDC, make sure the OIDC_NAMESPACE and OIDC_SERVICE_SLUG are properly set as inputs or environment variables in the pipeline.
   
   ```yaml
   authMethod: 'oidc'
   oidcNamespace: '$(your-namespace)'
   oidcServiceSlug: '$(your-service-slug)'
   ```

## Contributing

If you’d like to contribute to this project, feel free to submit a pull request. Please ensure your code adheres to the project’s coding guidelines and includes necessary documentation. You can check contributing guilde [here](https://github.com/cloudsmith-io/cloudsmith-ado-integration/blob/main/README.md).

## License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

## Support

If you encounter any issues, feel free to open an issue in this repository or contact [support@cloudsmith.io](mailto:support@cloudsmith.io).
