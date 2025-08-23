# 📦 Changelog

All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](https://semver.org/).

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