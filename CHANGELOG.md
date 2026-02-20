# 📦 Changelog

All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](https://semver.org/).

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
  Removed the end-of-life Node 16 fallback. The task now requires Azure DevOps agents that support the Node 20 runtime (agent v3.220+).

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

[0.0.1]: https://marketplace.visualstudio.com/items?itemName=Cloudsmith.CloudsmithCliSetupAndAuthenticate
[1.0.0]: https://marketplace.visualstudio.com/items?itemName=Cloudsmith.CloudsmithCliSetupAndAuthenticate
[1.1.0]: https://marketplace.visualstudio.com/items?itemName=Cloudsmith.CloudsmithCliSetupAndAuthenticate