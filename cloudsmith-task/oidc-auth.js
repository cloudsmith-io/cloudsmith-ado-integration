const axios = require('axios');
const tl = require('azure-pipelines-task-lib/task');

/**
 * Function to authenticate with Cloudsmith using OIDC and validate the token.
 * 
 * @param {string} orgName - The organization name for OIDC.
 * @param {string} serviceAccountSlug - The service account slug for OIDC.
 */
async function authenticateWithOIDC(orgName, serviceAccountSlug) {
  try {
    // Retrieve the OIDC ID token from Azure DevOps
    console.log('Retrieving OIDC token from Azure DevOps...');
    const idToken = tl.getEndpointAuthorizationParameter("SYSTEMVSSCONNECTION", "AccessToken", false);

    if (!idToken) {
      throw new Error('Failed to retrieve OIDC token from Azure DevOps.');
    }

    // Authenticate with Cloudsmith using the OIDC token
    console.log('Authenticating with Cloudsmith using OIDC...');
    const response = await axios.post(
      `https://api.cloudsmith.io/openid/${orgName}/`,
      {
        oidc_token: idToken,
        service_slug: serviceAccountSlug
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to authenticate with Cloudsmith: ${response.statusText}`);
    }

    // Extract the API token from the response
    const token = response.data.token;
    console.log('Successfully authenticated with OIDC.');

    // Export the token as an environment variable for Cloudsmith API key usage
    process.env.CLOUDSMITH_API_KEY = token;
    tl.setVariable('CLOUDSMITH_API_KEY', token);  // Persist OIDC token across tasks
    console.log('API token stored in environment variable CLOUDSMITH_API_KEY.');

    // Validate the token
    await validateToken(token);

  } catch (error) {
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

    console.log(`Token validated. Authenticated as ${response.data.name}.`);

  } catch (error) {
    tl.setResult(tl.TaskResult.Failed, `Token validation failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  authenticateWithOIDC,
};