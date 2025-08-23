const axios = require('axios');
const tl = require('azure-pipelines-task-lib/task');

/**
 * Function to authenticate with Cloudsmith using OIDC and validate the token.
 * 
 * @param {string} clientId - The Client ID from Azure AD.
 * @param {string} clientSecret - The Client Secret from Azure AD.
 * @param {string} appIdUri - scope of the Azure Entra Applcation ID URI
 * @param {string} tenantId - The Tenant ID from Azure AD.
 * @param {string} orgName - The organization name for OIDC.
 * @param {string} serviceAccountSlug - The service account slug for OIDC.
 */
async function authenticateWithOIDC(clientId, clientSecret, appIdUri, tenantId, orgName, serviceAccountSlug) {
  try {
    console.log('Generating OIDC token from Azure...');

    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: `${appIdUri}/.default`,
        grant_type: 'client_credentials'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const azureToken = tokenResponse.data.access_token;
    //console.log('OIDC Token retrieved successfully:', azureToken);  // Print OIDC token for debugging

    const payload = { oidc_token: azureToken };
    if (serviceAccountSlug) {
      payload.service_slug = serviceAccountSlug;
    }

    console.log('Authenticating with Cloudsmith using OIDC...');
    //console.log(`Request URL: https://api.cloudsmith.io/openid/${orgName}/`);
    //console.log('Payload:', JSON.stringify(payload, null, 2));  // Print payload for debugging

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
    console.log('Ephemeral API token stored as CLOUDSMITH_API_KEY and ready to be used for next 90 Minutes');

    await validateToken(token);
  } catch (error) {
    if (error.response) {
      console.error('Authentication error:', error.response.data);
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