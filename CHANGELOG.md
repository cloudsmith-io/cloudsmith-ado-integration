# 📦 Changelog

All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](https://semver.org/).

---

## [2.0.0] - Unreleased
### 🚀 Changed
- **Standalone CLI binary**
  The task now installs the self-contained Cloudsmith CLI binary via the bundled installer scripts (`install.sh` / `install.ps1`). No Python or pip is required on the agent.
- **CLI-native OIDC**
  The CLI performs the OIDC token exchange itself on first use. The task only validates the agent OIDC context and exports `CLOUDSMITH_ORG` and `CLOUDSMITH_SERVICE_SLUG`. OIDC now uses audience `api://AzureADTokenExchange` (was `cloudsmith`) — update your Cloudsmith OIDC provider configuration.
- **Install location and PATH**
  The CLI installs under the agent tools directory (configurable via `installDirectory`) instead of `/usr/local/bin`, and the task prepends the binary directory to `PATH` for subsequent steps.
- **New output variables**
  `cliVersion`, `target`, `cliPath`, and `binDirectory`.
- **`verifyAuth` input**
  Optionally runs `cloudsmith whoami` after setup.

### 🛡️ Security
- **API key masked**
  `CLOUDSMITH_API_KEY` is now exported as a secret pipeline variable; map it into the `env` of steps that need it.
- **Dependency updates**
  Applied `npm audit fix` for transitive dependencies, and bumped `azure-pipelines-task-lib` from `^4.17.3` to `^5.278.0`, clearing high-severity advisories in `adm-zip`, `minimatch`, and `uuid` (`uuid` is no longer a dependency of the task lib as of v5).

### ✂️ Removed
- **`pipInstall` and `oidcAuthOnly` inputs**
  The task always installs the standalone binary. The exchanged OIDC token is no longer exported as `$(CLOUDSMITH_API_KEY)`.
- **axios dependency**
  The task no longer performs HTTP requests; `azure-pipelines-task-lib` is the only runtime dependency.

---

## [1.2.1] - 2026-02-20
### 🛡️ Security
- **Updated axios dependency**
  Bumped axios from `^1.7.7` to `^1.13.5` to address a security vulnerability flagged by Dependabot.

### 🔧 Changed
- **Fixed Node.js execution handler**
  Corrected the Node 20 execution handler from `Node20` to `Node20_1` (the valid Azure DevOps handler name).
  Modern agents now correctly use Node 20 instead of silently falling back to Node 16.

### ✂️ Removed
- **Dropped Node 16 execution handler**
  Removed the end-of-life Node 16 fallback. The task now requires Azure DevOps agents that support the Node 20 and Node 18 runtime (agent v3.220+). 

---

## [1.2.0] - 2025-11-12
### 🚀 Enhanced
- **Native Azure DevOps OIDC Support**  
  Simplified OIDC authentication by using Azure DevOps' built-in OIDC tokens (`System.OidcRequestUri`).  
  No longer requires Azure AD app registration, client secrets, or tenant configuration.  

### ✂️ Removed
- **Azure AD Client Credentials Dependencies**  
  Eliminated the need for `clientId`, `clientSecret`, `appIdUri`, and `tenantId` parameters.  
  Reduces security risk by removing stored secrets and simplifies pipeline configuration.  

### 🔧 Changed
- **Simplified Task Inputs**  
  OIDC authentication now requires `oidcNamespace` (Cloudsmith organization name) and `oidcServiceSlug` (service account slug).  
  Reduced from 6 required parameters to just 2.  

### 🛡️ Security
- **Enhanced Security Model**  
  Uses short-lived, automatically managed Azure DevOps OIDC tokens.  
  Leverages pipeline context claims for improved authentication security.  

---

## [1.1.2] - 2025-11-12
### 🔧 Fixed
- **Backwards Support**  
  Downgrading to support the Entra OIDC method.

---

## [1.1.1] - 2025-10-27
### 🔧 Fixed
- **Node 16 Support**  
  Added Node 16 execution handler to improve compatibility with older Azure DevOps agent environments.  
  Extension now supports Node 16, 18, and 20 for maximum agent compatibility.  

---

## [1.0.0] - 2025-08-24
### Added
- **`oidcAuthOnly` option**  
  Allows skipping CLI installation entirely and only authenticating via OIDC.  
  When enabled, it saves the OIDC token as `CLOUDSMITH_API_KEY` for use in later pipeline steps.  

- **`pipInstall` option**  
  Provides an alternative installation method using `pip` instead of the zipapp.  
  Useful for environments where zipapp installation is restricted.  

### Changed
- First **production release** of the task with stable functionality.  
- Improved input handling in task UI to hide irrelevant flags when `oidcAuthOnly` is selected.  

---

## [0.0.1] - 2024-11-02
### Added
- Initial preview release of **Cloudsmith CLI Setup and Authenticate** for Azure Pipelines.  
- Features:
  - Install Cloudsmith CLI (`cloudsmith.pyz`) on agent.  
  - Authenticate with Cloudsmith using API Key or OIDC.  
  - Expose authentication via `CLOUDSMITH_API_KEY` environment variable for subsequent tasks.  

---

[1.2.1]: https://github.com/cloudsmith-io/cloudsmith-ado-integration/releases/tag/v1.2.1
[1.2.0]: https://github.com/cloudsmith-io/cloudsmith-ado-integration/releases/tag/v1.2.0
[1.1.2]: https://github.com/cloudsmith-io/cloudsmith-ado-integration/releases/tag/v1.1.2
[1.1.1]: https://github.com/cloudsmith-io/cloudsmith-ado-integration/releases/tag/v1.1.1
[1.1.0]: https://github.com/cloudsmith-io/cloudsmith-ado-integration/releases/tag/v1.1.0