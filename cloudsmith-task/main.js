const tl = require('azure-pipelines-task-lib/task');
const { installCli } = require('./install');
const { authenticateWithOIDC } = require('./oidc-auth');
const exec = require('child_process').exec;

async function run() {
  try {
    // New flag
    const oidcAuthOnly = tl.getBoolInput('oidcAuthOnly', false);

    // Common OIDC inputs (used when authMethod=oidc OR oidcAuthOnly=true)
    const clientId = tl.getInput('clientId', false);
    const clientSecret = tl.getInput('clientSecret', false);
    const appIdUri = tl.getInput('appIdUri', false);
    const tenantId = tl.getInput('tenantId', false);
    const orgName = tl.getInput('oidcNamespace', false);
    const serviceAccountSlug = tl.getInput('oidcServiceSlug', false);

    // Regular inputs (ignored when oidcAuthOnly=true)
    const cliVersion = tl.getInput('cliVersion', false);
    const authMethod = tl.getInput('authMethod', false);
    const apiKey = tl.getInput('apiKey', false);

    // Mode: OIDC auth only (no install, no verify)
    if (oidcAuthOnly) {
      console.log('OIDC Auth Only mode enabled: skipping CLI installation and running OIDC authentication only.');
      if (!clientId || !clientSecret || !appIdUri || !tenantId || !orgName || !serviceAccountSlug) {
        throw new Error('OIDC Auth Only requires clientId, clientSecret, appIdUri, tenantId, oidcNamespace, and oidcServiceSlug.');
      }
      await authenticateWithOIDC(clientId, clientSecret, appIdUri, tenantId, orgName, serviceAccountSlug);
      tl.setResult(tl.TaskResult.Succeeded, 'Authenticated via OIDC (no CLI installation). Token available as CLOUDSMITH_API_KEY.');
      return;
    }

    // Normal mode: install + authenticate (OIDC or API key) + verify
    // Step 1: Install the Cloudsmith CLI
    await installCli(cliVersion);
    console.log('Cloudsmith CLI installed successfully.');

    // Step 2: Authenticate using the selected method
    if (authMethod === 'oidc') {
      console.log('Authenticating using OIDC...');
      if (!clientId || !clientSecret || !appIdUri || !tenantId || !orgName || !serviceAccountSlug) {
        throw new Error('OIDC authentication requires clientId, clientSecret, appIdUri, tenantId, oidcNamespace and oidcServiceSlug.');
      }
      await authenticateWithOIDC(clientId, clientSecret, appIdUri, tenantId, orgName, serviceAccountSlug);
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

// Function to verify the Cloudsmith CLI is installed using 'cloudsmith whoami'
function verifyCloudsmithCLI() {
  return new Promise((resolve, reject) => {
    exec('cloudsmith whoami', (error, stdout, stderr) => {
      if (error) {
        return reject(`Failed to verify Cloudsmith CLI: ${stderr}`);
      }
      console.log(`Cloudsmith CLI verification output: ${stdout}`);
      resolve();
    });
  });
}

run();