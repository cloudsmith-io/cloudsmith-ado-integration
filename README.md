# Cloudsmith CLI Install & Authenticate Task for Azure DevOps

This Azure DevOps extension provides a task for installing the Cloudsmith CLI and authenticating with Cloudsmith using API Key or OpenID Connect (OIDC). This task integrates seamlessly into your Azure DevOps pipelines, making it easier to install the Cloudsmith CLI and authenticate for your package management tasks.

## Features

- **Install Cloudsmith CLI**: Install the latest or a specific version of the Cloudsmith CLI.
- **Authenticate with API Key or OIDC**: Securely authenticate with Cloudsmith to manage packages within your pipeline.
- **Seamless Integration**: Integrates directly into Azure DevOps Pipelines for automated tasks.

## Prerequisites

1. **Node.js (version 14.x or later)**:
 Download and install Node.js from [here](https://nodejs.org/en/).

2. **Azure DevOps Extension Tool (tfx-cli)**:
   The `tfx` CLI tool is required to create, package, and publish the extension.
   
    ```bash
    npm install -g tfx-cli
    ```

3. **Azure DevOps Personal Access Token (PAT)**:
   To publish the extension, you need a PAT with the appropriate permissions.

## Project Setup and Build Instructions

1. **Clone the Repository**:
   First, clone the repository to your local machine:

   ```bash
   git clone https://github.com/cloudsmith-io/cloudsmith-ado-integration.git
   cd cloudsmith-ado-integration
   ```

2. **Install Dependencies**:
   Run the following command to install the necessary dependencies, including azure-pipelines-task-lib and axios:
   
   ```bash
   npm install
   ```

3. **Create a GUID for the Task ID**:
   Azure DevOps tasks require a globally unique ID. Use the following command to generate a new GUID:
   
   ```bash
   uuidgen
   ```

   Update the generated GUID in the task.json file
   ```json
   "id": "YOUR-GENERATED-GUID-HERE"
   ```

4. **Build the Project**:
   Once the dependencies are installed and the task is configured, you can build the project. If TypeScript is being used, compile the TypeScript files:
   
   ```bash
   npm run build
   ```

5. **Build the Project**:
   You can test the task locally by running it with Node.js. Set up your environment variables and use npm to run your task locally before publishing it to the Azure DevOps Marketplace.

6. **Package the Extension**:
   To package the extension into a .vsix file, use the following command:

   ```bash
   tfx extension create --manifest-globs vss-extension.json
   ```

7. **Publish the Extension**:
   You can now publish the packaged .vsix file to the Azure DevOps Marketplace using the tfx CLI and your Personal Access Token (PAT):

   ```bash
   tfx extension publish --manifest-globs vss-extension.json --publisher YOUR-PUBLISHER-ID --token YOUR-PAT
   ```

## Usage in Azure DevOps Pipelines

Once the extension is installed, you can use it in your Azure DevOps pipelines by adding it to your pipeline YAML. Below is an example:

   ```bash
   jobs:
    - job: InstallCloudsmithandAuthenticate
  pool:
    vmImage: 'ubuntu-latest' #Modify Accordingly
  steps:
  # Install and Authenticate with Cloudsmith CLI
  - task: CloudsmithCliInstallAndAuthenticate
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

**API Key Authentication**:
   To authenticate via OIDC, make sure the OIDC_NAMESPACE and OIDC_SERVICE_SLUG are properly set as inputs or environment variables in the pipeline.
   
   ```yaml
   authMethod: 'oidc'
   oidcNamespace: '$(your-namespace)'
   oidcServiceSlug: '$(your-service-slug)'
   ```

## Authentication Options

If you’d like to contribute to this project, feel free to submit a pull request. Please ensure your code adheres to the project’s coding guidelines and includes necessary documentation.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Support

If you encounter any issues, feel free to open an issue in this repository or contact [support@cloudsmith.io](mailto:support@cloudsmith.io).