const tl = require('azure-pipelines-task-lib/task');
const axios = require('axios');
const { installCli, installCliViaPip } = require('./install');
const { authenticateWithOIDC } = require('./oidc-auth');
const exec = require('child_process').exec;

async function run() {
  try {
    // New flag
    const oidcAuthOnly = tl.getBoolInput('oidcAuthOnly', false);
    const pipInstall = tl.getBoolInput('pipInstall', false);

    // OIDC inputs (used when authMethod=oidc OR oidcAuthOnly=true)
    const orgName = tl.getInput('oidcNamespace', false);
    const serviceAccountSlug = tl.getInput('oidcServiceSlug', false);

    // Regular inputs (ignored when oidcAuthOnly=true)
    const cliVersion = tl.getInput('cliVersion', false);
    const authMethod = tl.getInput('authMethod', false);
    const apiKey = tl.getInput('apiKey', false);

    // Mode: OIDC auth only (no install, no verify)
    if (oidcAuthOnly) {
      console.log('OIDC Auth Only mode enabled: skipping CLI installation and running OIDC authentication only.');
      if (!orgName) {
        throw new Error('OIDC Auth Only requires oidcNamespace (Cloudsmith organization name).');
      }
      await authenticateWithOIDC(orgName, serviceAccountSlug);
      await verifyCloudsmithCLI(); // show validated user name in OIDC-only mode
      tl.setResult(tl.TaskResult.Succeeded, 'Authenticated via OIDC (no CLI installation). Token available as CLOUDSMITH_API_KEY.');
      return;
    }

    // Normal mode: install + authenticate (OIDC or API key) + verify
    // Step 1: Install the Cloudsmith CLI (zipapp by default, pip when selected)
    if (pipInstall) {
      await installCliViaPip(cliVersion);
      console.log('Cloudsmith CLI installed successfully via pip.');
    } else {
      await installCli(cliVersion);
      console.log('Cloudsmith CLI installed successfully (zipapp).');
    }

    // Step 2: Authenticate using the selected method
    if (authMethod === 'oidc') {
      console.log('Authenticating using OIDC...');
      if (!orgName) {
        throw new Error('OIDC authentication requires oidcNamespace (Cloudsmith organization name).');
      }
      await authenticateWithOIDC(orgName, serviceAccountSlug);
    } else if (authMethod === 'apiKey' && apiKey) {
      process.env.CLOUDSMITH_API_KEY = apiKey;
      tl.setVariable('CLOUDSMITH_API_KEY', apiKey);
      console.log('Using provided API key for authentication.');
    } else {
      throw new Error('Invalid authentication method or missing inputs.');
    }

    // Step 3: Verify the Cloudsmith CLI installation
    await verifyCloudsmithCLI();
    console.log('Cloudsmith CLI verified successfully.');

    // Set task result to success
    tl.setResult(tl.TaskResult.Succeeded, 'Cloudsmith CLI installed and authenticated successfully.');
  } catch (error) {
    console.error('Error:', error.message);
    tl.setResult(tl.TaskResult.Failed, `Task failed: ${error.message}`);
  }
}

function verifyCloudsmithCLI() {
  return new Promise(async (resolve, reject) => {
    try {
      const token = process.env.CLOUDSMITH_API_KEY;
      if (!token) {
        throw new Error('Failed to verify Cloudsmith CLI: CLOUDSMITH_API_KEY not set');
      }
      console.log('Validating Cloudsmith API token...');
      const response = await axios.get(
        'https://api.cloudsmith.io/v1/user/self/',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        }
      );

      if (!response.data || !response.data.name) {
        throw new Error('Failed to validate token. No user information found.');
      }

      console.log(`Token validated successfully. Authenticated as ${response.data.name}.`);
      resolve();
    } catch (error) {
      if (error && error.response) {
        console.error('Token validation error:', error.response.data);
      }
      tl.setResult(tl.TaskResult.Failed, `Token validation failed: ${error && error.message ? error.message : error}`);
      reject(error);
    }
  });
}

run();