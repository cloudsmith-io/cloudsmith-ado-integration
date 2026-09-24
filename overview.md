# Cloudsmith CLI Setup & Authenticate for Azure DevOps Pipelines

This extension installs the standalone [Cloudsmith CLI](https://github.com/cloudsmith-io/cloudsmith-cli) in your Azure DevOps pipelines and configures authentication with Cloudsmith. The CLI is a self-contained binary — no Python or pip required on the agent.

With this extension, you can:

- Install the latest or a pinned version of the Cloudsmith CLI on Linux, macOS, and Windows agents.
- Authenticate using an API key or Azure DevOps native OIDC (no Azure AD app registration).
- Use the `cloudsmith` command directly in subsequent steps — the task adds it to `PATH`.

## Getting started

1. Add the `CloudsmithCliSetupAndAuthenticate@2` task to your pipeline.
2. Choose an authentication method:
   - **API key**: provide `apiKey` from a secret pipeline variable.
   - **OIDC**: provide `oidcNamespace` and `oidcServiceSlug`, configure an [OIDC provider in Cloudsmith](https://docs.cloudsmith.com/authentication/openid-connect) with audience `api://AzureADTokenExchange`, and map `SYSTEM_ACCESSTOKEN: $(System.AccessToken)` in the step `env`.
3. Optionally pin `cliVersion` and enable `verifyAuth` to run `cloudsmith whoami`.
4. Optionally enable `exportAuthToken` to export the resolved token as the secret variable `CLOUDSMITH_API_KEY` for other tools. This requires Cloudsmith CLI 1.21.0 or later.

### Example: OIDC

```yaml
steps:
  - task: CloudsmithCliSetupAndAuthenticate@2
    inputs:
      cliVersion: '1.20.0'
      authMethod: 'oidc'
      oidcNamespace: 'your-org'
      oidcServiceSlug: 'your-service-account'
      verifyAuth: true
    env:
      SYSTEM_ACCESSTOKEN: $(System.AccessToken)

  - script: cloudsmith push raw your-org/your-repo my-package.zip
    env:
      SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

`SYSTEM_ACCESSTOKEN` must be mapped on the task and on every later step that runs an authenticated `cloudsmith` command — the CLI exchanges the OIDC token on first use.

### Example: API key

```yaml
steps:
  - task: CloudsmithCliSetupAndAuthenticate@2
    inputs:
      authMethod: 'apiKey'
      apiKey: $(MY_CLOUDSMITH_API_KEY)
      verifyAuth: true

  - script: cloudsmith push raw your-org/your-repo my-package.zip
    env:
      CLOUDSMITH_API_KEY: $(CLOUDSMITH_API_KEY)
```

The task exports `CLOUDSMITH_API_KEY` as a secret pipeline variable; map it into the `env` of steps that need it.

## Upgrading from @1

`@2` installs the standalone CLI binary instead of the Python zipapp, and the CLI now performs the OIDC token exchange itself. The `pipInstall` and `oidcAuthOnly` inputs were removed. The exchanged OIDC token is exported as `$(CLOUDSMITH_API_KEY)` only when you set `exportAuthToken: true`. The OIDC audience changed from `cloudsmith` to `api://AzureADTokenExchange` — update your Cloudsmith OIDC provider configuration accordingly. See the [migration guide](https://github.com/cloudsmith-io/cloudsmith-ado-integration#migrating-from-1-to-2) for details.

## Support

If you encounter any issues or need help, reach out to the Cloudsmith support team at [support@cloudsmith.io](mailto:support@cloudsmith.io).
