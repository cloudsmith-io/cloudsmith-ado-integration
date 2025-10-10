const axios = require('axios');
const tl = require('azure-pipelines-task-lib/task');

// Constants
const AZURE_DEVOPS_API_VERSION = '7.1';
const OIDC_AUDIENCE = 'cloudsmith';

/**
 * Function to authenticate with Cloudsmith using Azure DevOps native OIDC token.
 * 
 * @param {string} orgName - The Cloudsmith organization name for OIDC.
 * @param {string} serviceAccountSlug - The service account slug for OIDC (optional).
 */
async function authenticateWithOIDC(orgName, serviceAccountSlug) {
  try {
    console.log('Using Azure DevOps OIDC token...');

    // Get the Azure DevOps system variables
    const oidcRequestUri = tl.getVariable('System.OidcRequestUri');
    const accessToken = tl.getVariable('System.AccessToken');

    if (!oidcRequestUri || !accessToken) {
      throw new Error('Azure DevOps OIDC not available. Enable "Allow scripts to access the OAuth token" in Agent Job settings.');
    }

    console.log('Requesting OIDC token from Azure DevOps...');
    
    // Request the OIDC token from Azure DevOps using System.AccessToken
    const oidcUrl = `${oidcRequestUri}?api-version=${AZURE_DEVOPS_API_VERSION}&audience=${OIDC_AUDIENCE}`;
    const tokenResponse = await axios.post(
      oidcUrl,
      {},  // Empty body for POST request
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Length': '0'
        }
      }
    );

    const azureToken = tokenResponse.data.oidcToken;
    if (!azureToken) {
      throw new Error('Failed to obtain OIDC token from Azure DevOps');
    }

    console.log('Azure DevOps OIDC token obtained successfully');

    const payload = { oidc_token: azureToken };
    if (serviceAccountSlug) {
      payload.service_slug = serviceAccountSlug;
    }



    const response = await axios.post(
      `https://api.cloudsmith.io/openid/${orgName}/`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to authenticate with Cloudsmith: ${response.statusText}`);
    }

    const token = response.data.token;
    console.log('OIDC authentication successful.');

    process.env.CLOUDSMITH_API_KEY = token;
    tl.setVariable('CLOUDSMITH_API_KEY', token);
    console.log('Ephemeral API token stored as CLOUDSMITH_API_KEY and ready to be used for next 90 minutes');

    //await validateToken(token);
  } catch (error) {
    if (error.response) {
      console.error('Authentication error:', error.response.data);
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Hint: Ensure your pipeline has OIDC token permissions enabled and the Cloudsmith OIDC provider is configured with https://vstoken.dev.azure.com/{ORG_GUID}');
      }
    }
    tl.setResult(tl.TaskResult.Failed, `OIDC authentication failed: ${error.message}`);
    throw error;
  }
}

/**
 * Function to validate the Cloudsmith API token.
 * 
 * @param {string} token - The Cloudsmith API token.
 */
async function validateToken(token) {
  try {
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
  } catch (error) {
    if (error.response) {
      console.error('Token validation error:', error.response.data);
    }
    tl.setResult(tl.TaskResult.Failed, `Token validation failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  authenticateWithOIDC,
};