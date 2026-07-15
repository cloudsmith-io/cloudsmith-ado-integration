'use strict';

const childProcess = require('child_process');
const os = require('os');
const path = require('path');
const tl = require('azure-pipelines-task-lib/task');

function runProcess(command, args, captureStdout, env) {
  const result = childProcess.spawnSync(command, args, {
    env: env || process.env,
    encoding: 'utf8',
    stdio: ['ignore', captureStdout ? 'pipe' : 'inherit', 'inherit'],
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} exited with code ${result.status}`);
  }
  return result.stdout || '';
}

function parseInstallerOutput(output) {
  const values = {};
  for (const line of output.split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator > 0) {
      values[line.slice(0, separator)] = line.slice(separator + 1);
    }
  }

  for (const key of ['version', 'target', 'bin_dir', 'executable']) {
    if (!values[key]) {
      throw new Error(`Installer output is missing ${key}`);
    }
  }
  return values;
}

// Environment for child processes that don't need task inputs.
function envWithoutInputs() {
  const env = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.startsWith('INPUT_')) {
      env[name] = value;
    }
  }
  return env;
}

function installCli(cliVersion, installRoot, installerDir) {
  const env = envWithoutInputs();
  let output;
  if (process.platform === 'win32') {
    const script = path.join(installerDir, 'install.ps1');
    const powerShell = tl.which('pwsh', false) || tl.which('powershell', true);
    output = runProcess(
      powerShell,
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        script,
        '-Version',
        cliVersion,
        '-InstallRoot',
        installRoot,
      ],
      true,
      env,
    );
  } else {
    const script = path.join(installerDir, 'install.sh');
    const shell = tl.which('sh', true);
    output = runProcess(
      shell,
      [script, '--version', cliVersion, '--install-root', installRoot],
      true,
      env,
    );
  }
  return parseInstallerOutput(output);
}

function exportVariable(name, value, secret) {
  if (/\r|\n/.test(value)) {
    throw new Error(`${name} must not contain a newline`);
  }
  if (secret) {
    tl.setSecret(value);
  }
  // setVariable removes secret values from process.env, so child processes
  // spawned by this task must receive them via an explicit env object.
  tl.setVariable(name, value, secret);
}

// Configures pipeline variables and returns the env vars the CLI needs.
function configureAuthentication() {
  const authMethod = (tl.getInput('authMethod', true) || '').toLowerCase();

  if (authMethod === 'apikey') {
    const apiKey = tl.getInput('apiKey', false);
    if (!apiKey) {
      throw new Error('authMethod is apiKey but no apiKey was provided.');
    }
    exportVariable('CLOUDSMITH_API_KEY', apiKey, true);
    return { CLOUDSMITH_API_KEY: apiKey };
  }

  if (authMethod === 'oidc') {
    const organization = tl.getInput('oidcNamespace', false);
    const serviceSlug = tl.getInput('oidcServiceSlug', false);
    if (!organization || !serviceSlug) {
      throw new Error('authMethod is oidc but oidcNamespace or oidcServiceSlug is missing.');
    }
    if (!process.env.SYSTEM_OIDCREQUESTURI) {
      throw new Error(
        'SYSTEM_OIDCREQUESTURI is not available. OIDC authentication requires an Azure DevOps agent that provides System.OidcRequestUri.',
      );
    }
    if (!process.env.SYSTEM_ACCESSTOKEN) {
      throw new Error(
        'SYSTEM_ACCESSTOKEN is not set. Map it on this task: env: SYSTEM_ACCESSTOKEN: $(System.AccessToken)',
      );
    }
    exportVariable('CLOUDSMITH_ORG', organization, false);
    exportVariable('CLOUDSMITH_SERVICE_SLUG', serviceSlug, false);
    return {
      CLOUDSMITH_ORG: organization,
      CLOUDSMITH_SERVICE_SLUG: serviceSlug,
      SYSTEM_OIDCREQUESTURI: process.env.SYSTEM_OIDCREQUESTURI,
      SYSTEM_ACCESSTOKEN: process.env.SYSTEM_ACCESSTOKEN,
    };
  }

  throw new Error(`Unsupported authMethod: ${authMethod}. Use apiKey or oidc.`);
}

async function run(installerDir) {
  try {
    // Mask the API key in logs before any child process runs.
    const apiKey = tl.getInput('apiKey', false);
    if (apiKey) {
      tl.setSecret(apiKey);
    }

    const cliVersion = tl.getInput('cliVersion', false) || 'latest';
    const installRoot =
      tl.getInput('installDirectory', false) ||
      path.join(
        tl.getVariable('Agent.ToolsDirectory') || tl.getVariable('Agent.TempDirectory') || os.tmpdir(),
        'cloudsmith-cli',
      );

    const installation = installCli(
      cliVersion,
      installRoot,
      installerDir || path.join(__dirname, 'installer'),
    );

    tl.prependPath(installation.bin_dir);
    tl.setVariable('cliVersion', installation.version, false, true);
    tl.setVariable('target', installation.target, false, true);
    tl.setVariable('cliPath', installation.executable, false, true);
    tl.setVariable('binDirectory', installation.bin_dir, false, true);

    const authEnv = configureAuthentication();

    if (tl.getBoolInput('verifyAuth', false)) {
      runProcess(installation.executable, ['whoami'], false, {
        ...envWithoutInputs(),
        ...authEnv,
      });
    }

    tl.setResult(
      tl.TaskResult.Succeeded,
      `Cloudsmith CLI ${installation.version} (${installation.target}) installed and configured.`,
    );
  } catch (error) {
    tl.setResult(tl.TaskResult.Failed, error instanceof Error ? error.message : String(error));
  }
}

module.exports = { parseInstallerOutput, installCli, run };

if (require.main === module) {
  run();
}
