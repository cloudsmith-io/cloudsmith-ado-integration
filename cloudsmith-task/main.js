const tl = require('azure-pipelines-task-lib/task');
const { installCli } = require('./install');
const { authenticateWithOIDC } = require('./oidc-auth');
const exec = require('child_process').exec;

async function run() {
  try {
    const cliVersion = tl.getInput('cliVersion', false);
    const authMethod = tl.getInput('authMethod', true);
    const orgName = tl.getInput('oidcNamespace', false);
    const serviceAccountSlug = tl.getInput('oidcServiceSlug', false);
    const apiKey = tl.getInput('apiKey', false);

    // Step 1: Install the Cloudsmith CLI
    await installCli(cliVersion);
    console.log('Cloudsmith CLI installed successfully.');

    // Step 2: Authenticate based on the selected method (API Key or OIDC)
    if (authMethod === 'oidc' && orgName && serviceAccountSlug) {
      console.log('Authenticating using OIDC...');
      await authenticateWithOIDC(orgName, serviceAccountSlug);
    } else if (authMethod === 'apiKey' && apiKey) {
      process.env.CLOUDSMITH_API_KEY = apiKey;
      console.log('Using provided API key for authentication.');
      tl.setVariable('CLOUDSMITH_API_KEY', apiKey);  // Persist API Key across tasks
    } else {
      throw new Error('Invalid authentication method selected, or required inputs missing.');
    }

    // Step 3: Verify the CLI installation by running 'cloudsmith whoami'
    await verifyCloudsmithCLI();
    tl.setResult(tl.TaskResult.Succeeded, 'Cloudsmith CLI installed and authenticated successfully.');
  } catch (error) {
    console.error('Error occurred during task execution:', error.stack || error.message || error);
    tl.setResult(tl.TaskResult.Failed, `Action failed: ${error.message || error}`);
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