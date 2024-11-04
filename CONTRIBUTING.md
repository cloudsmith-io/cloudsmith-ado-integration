## Contributing to Cloudsmith Azure DevOps Extension

We welcome contributions to this project. This document outlines the setup instructions and guidelines for contributing.

## Pull Requests
- Fork the repository and create your branch from main.
- Ensure the code adheres to the project’s coding guidelines and includes necessary documentation.
- Make sure all tests pass locally.
- Submit a pull request with a description of the changes.

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

## License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).