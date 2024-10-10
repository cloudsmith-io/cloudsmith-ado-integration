# Cloudsmith Azure DevOps Integration

**cloudsmith-ado-integration** is a collection of Azure DevOps extensions for seamless integration with Cloudsmith. This project automates artifact management, repository operations, and package uploads from Azure DevOps pipelines to Cloudsmith repositories.

## Features

- **Install Cloudsmith CLI**: Install the Cloudsmith CLI on the build agent with flexibility to specify a version.
- **Push Build Artifacts to Cloudsmith**: Automatically upload build artifacts from Azure DevOps pipelines to Cloudsmith repositories.
- **Create Cloudsmith Repository**: Dynamically create new Cloudsmith repositories within a pipeline.
- **Delete Cloudsmith Repository**: Automate repository deletion when no longer needed.
- **Download a Package from Cloudsmith**: Download specific packages from Cloudsmith repositories to the build agent.
- **Set Repository Permissions**: Set or modify repository permissions within Cloudsmith.

## Requirements

- Azure DevOps organization
- Cloudsmith account and API key

## Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/cloudsmith-ado-integration.git
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Package the extension:

    ```bash
    tfx extension create --manifest-globs vss-extension.json
    ```

4. Publish the extension to Azure DevOps:

    ```bash
    tfx extension publish --publisher <your-publisher-id> --manifest-globs vss-extension.json --token <personal-access-token>
    ```

## Usage

Once the extension is installed in your Azure DevOps organization, you can use the tasks in your YAML pipelines as follows:

```yaml
steps:
  - task: your-publisher.cloudsmith-cli-install-task@1
    displayName: 'Install Cloudsmith CLI'
