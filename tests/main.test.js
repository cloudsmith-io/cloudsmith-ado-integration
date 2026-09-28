'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { beforeEach, test } = require('node:test');

const taskDir = path.join(__dirname, '..', 'cloudsmith-task');
const fixtureInstallerDir = path.join(__dirname, 'fixtures', 'fake-installer');

// Replace azure-pipelines-task-lib with a recording mock before main.js loads it.
const mockTl = {
  TaskResult: { Succeeded: 0, Failed: 2 },
  inputs: {},
  variables: {},
  setVariableCalls: [],
  secrets: [],
  prependedPaths: [],
  result: null,
  getInput(name) {
    return this.inputs[name];
  },
  getBoolInput(name) {
    return this.inputs[name] === 'true' || this.inputs[name] === true;
  },
  getVariable(name) {
    return this.variables[name];
  },
  setVariable(name, value, secret = false, isOutput = false) {
    this.setVariableCalls.push({ name, value, secret, isOutput });
    // Mirror the real task-lib: secret values are removed from process.env.
    const key = name.replace(/\./g, '_').toUpperCase();
    if (secret) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  },
  setSecret(value) {
    this.secrets.push(value);
  },
  prependPath(value) {
    this.prependedPaths.push(value);
  },
  which(tool) {
    return tool;
  },
  setResult(result, message) {
    this.result = { result, message };
  },
};

const tlPath = require.resolve('azure-pipelines-task-lib/task', { paths: [taskDir] });
require.cache[tlPath] = { id: tlPath, filename: tlPath, loaded: true, exports: mockTl };
const main = require(path.join(taskDir, 'main.js'));

function setVariableByName(name) {
  return mockTl.setVariableCalls.find((call) => call.name === name);
}

beforeEach(() => {
  mockTl.inputs = { authMethod: 'apiKey', apiKey: 'test-key' };
  mockTl.variables = { 'Agent.ToolsDirectory': path.join(__dirname, 'tmp-tools') };
  mockTl.setVariableCalls = [];
  mockTl.secrets = [];
  mockTl.prependedPaths = [];
  mockTl.result = null;
  for (const name of [
    'CLOUDSMITH_API_KEY',
    'CLOUDSMITH_ORG',
    'CLOUDSMITH_SERVICE_SLUG',
    'CLOUDSMITH_USERNAME',
    'SYSTEM_OIDCREQUESTURI',
    'SYSTEM_ACCESSTOKEN',
    'FAKE_INSTALLER_FAIL',
    'FAKE_CLOUDSMITH_FAIL',
    'FAKE_CLOUDSMITH_LOG',
    'FAKE_CREDENTIAL_HELPER_OUTPUT',
    'INPUT_APIKEY',
    'CLIVERSION',
    'TARGET',
    'CLIPATH',
    'BINDIRECTORY',
  ]) {
    delete process.env[name];
  }
});

test('parseInstallerOutput reads key=value lines and ignores noise', () => {
  const parsed = main.parseInstallerOutput(
    'noise without separator\nversion=1.19.2\ntarget=linux-x86_64-gnu\nbin_dir=/opt/c\nexecutable=/opt/c/cloudsmith\n',
  );
  assert.deepStrictEqual(parsed, {
    version: '1.19.2',
    target: 'linux-x86_64-gnu',
    bin_dir: '/opt/c',
    executable: '/opt/c/cloudsmith',
  });
});

test('parseInstallerOutput handles CRLF line endings', () => {
  const parsed = main.parseInstallerOutput(
    'version=1.19.2\r\ntarget=windows-x86_64\r\nbin_dir=C:\\t\\cloudsmith\r\nexecutable=C:\\t\\cloudsmith\\cloudsmith.exe\r\n',
  );
  assert.strictEqual(parsed.executable, 'C:\\t\\cloudsmith\\cloudsmith.exe');
});

test('parseInstallerOutput rejects output missing a required key', () => {
  assert.throws(
    () => main.parseInstallerOutput('version=1.19.2\ntarget=linux-x86_64-gnu\n'),
    /missing bin_dir/,
  );
});

test('run installs the CLI, prepends PATH, and sets output variables', async () => {
  mockTl.inputs.cliVersion = '1.2.3';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  const expectedRoot = path.join(__dirname, 'tmp-tools', 'cloudsmith-cli');
  assert.strictEqual(mockTl.prependedPaths.length, 1);
  assert.ok(mockTl.prependedPaths[0].startsWith(expectedRoot));

  assert.deepStrictEqual(setVariableByName('cliVersion'), {
    name: 'cliVersion',
    value: '1.2.3',
    secret: false,
    isOutput: true,
  });
  assert.strictEqual(setVariableByName('target').value, 'testos-x86_64');
  assert.strictEqual(setVariableByName('cliPath').isOutput, true);
  assert.strictEqual(setVariableByName('binDirectory').value, mockTl.prependedPaths[0]);
});

test('run honours the installDirectory input', async () => {
  mockTl.inputs.installDirectory = path.join(__dirname, 'custom-root');
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.ok(mockTl.prependedPaths[0].startsWith(path.join(__dirname, 'custom-root')));
});

test('run fails when the installer exits non-zero', async () => {
  process.env.FAKE_INSTALLER_FAIL = '1';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /exited with code 1/);
});

test('apiKey auth exports CLOUDSMITH_API_KEY as a secret variable', async () => {
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.ok(mockTl.secrets.includes('test-key'));
  assert.deepStrictEqual(setVariableByName('CLOUDSMITH_API_KEY'), {
    name: 'CLOUDSMITH_API_KEY',
    value: 'test-key',
    secret: true,
    isOutput: false,
  });
  // Secret variables are removed from process.env by the task-lib.
  assert.strictEqual(process.env.CLOUDSMITH_API_KEY, undefined);
});

test('apiKey auth fails without an apiKey input', async () => {
  delete mockTl.inputs.apiKey;
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /no apiKey was provided/);
});

test('oidc auth exports CLOUDSMITH_ORG and CLOUDSMITH_SERVICE_SLUG', async () => {
  mockTl.inputs = {
    authMethod: 'oidc',
    oidcNamespace: 'my-org',
    oidcServiceSlug: 'my-service',
  };
  process.env.SYSTEM_OIDCREQUESTURI = 'https://dev.azure.com/org/_apis/oidctoken';
  process.env.SYSTEM_ACCESSTOKEN = 'agent-token';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.strictEqual(setVariableByName('CLOUDSMITH_ORG').value, 'my-org');
  assert.strictEqual(setVariableByName('CLOUDSMITH_SERVICE_SLUG').value, 'my-service');
  assert.deepStrictEqual(mockTl.secrets, []);
});

test('oidc auth fails with an actionable error when SYSTEM_ACCESSTOKEN is missing', async () => {
  mockTl.inputs = {
    authMethod: 'oidc',
    oidcNamespace: 'my-org',
    oidcServiceSlug: 'my-service',
  };
  process.env.SYSTEM_OIDCREQUESTURI = 'https://dev.azure.com/org/_apis/oidctoken';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /SYSTEM_ACCESSTOKEN: \$\(System\.AccessToken\)/);
});

test('oidc auth fails when SYSTEM_OIDCREQUESTURI is unavailable', async () => {
  mockTl.inputs = {
    authMethod: 'oidc',
    oidcNamespace: 'my-org',
    oidcServiceSlug: 'my-service',
  };
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /SYSTEM_OIDCREQUESTURI/);
});

test('oidc auth fails when oidcNamespace or oidcServiceSlug is missing', async () => {
  mockTl.inputs = { authMethod: 'oidc', oidcNamespace: 'my-org' };
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /oidcNamespace or oidcServiceSlug/);
});

// The fake cloudsmith fails without auth env, so this also proves the verify
// child receives CLOUDSMITH_API_KEY even though setVariable removed it from
// process.env.
test('verifyAuth runs cloudsmith whoami with the apiKey auth env', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs.verifyAuth = 'true';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
});

test('verifyAuth runs cloudsmith whoami with the oidc auth env', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs = {
    authMethod: 'oidc',
    oidcNamespace: 'my-org',
    oidcServiceSlug: 'my-service',
    verifyAuth: 'true',
  };
  process.env.SYSTEM_OIDCREQUESTURI = 'https://dev.azure.com/org/_apis/oidctoken';
  process.env.SYSTEM_ACCESSTOKEN = 'agent-token';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
});

test('verifyAuth fails the task when whoami fails', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs.verifyAuth = 'true';
  process.env.FAKE_CLOUDSMITH_FAIL = '1';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /exited with code 1/);
});

test('parseCredentialHelperOutput returns the username and password of a version 1 document', () => {
  assert.deepStrictEqual(
    main.parseCredentialHelperOutput('{"version":1,"username":"token","password":"secret"}\n'),
    { username: 'token', password: 'secret' },
  );
});

test('parseCredentialHelperOutput rejects unsupported documents', () => {
  for (const output of [
    'not json',
    '"secret"',
    '[]',
    '{"version":2,"username":"token","password":"secret"}',
    '{"version":1,"username":"user","password":"secret"}',
    '{"version":1,"username":"token","password":""}',
    '{"version":1,"username":"token","password":7}',
    '{"version":1,"username":"token","password":"secret","extra":true}',
  ]) {
    assert.throws(
      () => main.parseCredentialHelperOutput(output),
      /invalid or unsupported credential-helper response/,
      output,
    );
  }
});

function oidcInputs(extra) {
  process.env.SYSTEM_OIDCREQUESTURI = 'https://dev.azure.com/org/_apis/oidctoken';
  process.env.SYSTEM_ACCESSTOKEN = 'agent-token';
  return { authMethod: 'oidc', oidcNamespace: 'my-org', oidcServiceSlug: 'my-service', ...extra };
}

function fakeCloudsmithLog() {
  const logPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cloudsmith-log-')), 'cloudsmith.log');
  fs.writeFileSync(logPath, '');
  process.env.FAKE_CLOUDSMITH_LOG = logPath;
  return () => fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
}

test('exportAuthToken is off by default and does not run the credential helper', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs = oidcInputs();
  const readLog = fakeCloudsmithLog();
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.deepStrictEqual(readLog(), []);
  assert.strictEqual(setVariableByName('CLOUDSMITH_API_KEY'), undefined);
  assert.strictEqual(setVariableByName('CLOUDSMITH_USERNAME'), undefined);
});

test('exportAuthToken with oidc exports the exchanged token as a secret variable', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs = oidcInputs({ exportAuthToken: 'true' });
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.ok(mockTl.secrets.includes('exchanged-my-service'));
  assert.deepStrictEqual(setVariableByName('CLOUDSMITH_API_KEY'), {
    name: 'CLOUDSMITH_API_KEY',
    value: 'exchanged-my-service',
    secret: true,
    isOutput: false,
  });
  assert.deepStrictEqual(setVariableByName('CLOUDSMITH_USERNAME'), {
    name: 'CLOUDSMITH_USERNAME',
    value: 'token',
    secret: false,
    isOutput: false,
  });
});

test('exportAuthToken with oidc ignores a CLOUDSMITH_API_KEY exported by an earlier step', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs = oidcInputs({ exportAuthToken: 'true' });
  process.env.CLOUDSMITH_API_KEY = 'earlier-token';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.strictEqual(setVariableByName('CLOUDSMITH_API_KEY').value, 'exchanged-my-service');
});

test('exportAuthToken with apiKey exports the key resolved by the credential helper', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs.exportAuthToken = 'true';
  const readLog = fakeCloudsmithLog();
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.deepStrictEqual(readLog(), ['credential-helper generic key=test-key']);
  assert.strictEqual(setVariableByName('CLOUDSMITH_USERNAME').value, 'token');
});

test('verifyAuth uses the exported token instead of a second exchange', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs = oidcInputs({ exportAuthToken: 'true', verifyAuth: 'true' });
  const readLog = fakeCloudsmithLog();
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
  assert.deepStrictEqual(readLog(), [
    'credential-helper generic key=',
    'whoami key=exchanged-my-service',
  ]);
});

test('exportAuthToken fails with an actionable error when the credential helper fails', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs = oidcInputs({ exportAuthToken: 'true' });
  process.env.FAKE_CLOUDSMITH_FAIL = '1';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /requires Cloudsmith CLI 1\.21\.0 or later/);
  assert.strictEqual(setVariableByName('CLOUDSMITH_USERNAME'), undefined);
});

test('exportAuthToken fails without exporting an unsupported credential-helper response', { skip: process.platform === 'win32' }, async () => {
  mockTl.inputs = oidcInputs({ exportAuthToken: 'true' });
  process.env.FAKE_CREDENTIAL_HELPER_OUTPUT = '{"version":2,"username":"token","password":"raw"}';
  await main.run(fixtureInstallerDir);

  assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Failed);
  assert.match(mockTl.result.message, /invalid or unsupported credential-helper response/);
  assert.strictEqual(setVariableByName('CLOUDSMITH_API_KEY'), undefined);
});

function withSpawnSyncSpy(fn) {
  const cp = require('node:child_process');
  const original = cp.spawnSync;
  const calls = [];
  cp.spawnSync = (command, args, options) => {
    calls.push({ command, args, options, secretsAtCall: mockTl.secrets.slice() });
    return {
      status: 0,
      stdout: 'version=1.2.3\ntarget=testos-x86_64\nbin_dir=/opt/c\nexecutable=/opt/c/cloudsmith\n',
    };
  };
  try {
    return fn(calls);
  } finally {
    cp.spawnSync = original;
  }
}

test('installer child env strips INPUT_ and auth variables and the apiKey is masked first', async () => {
  process.env.INPUT_APIKEY = 'test-key';
  process.env.CLOUDSMITH_API_KEY = 'ambient-key';
  process.env.SYSTEM_ACCESSTOKEN = 'agent-token';
  process.env.SYSTEM_OIDCREQUESTURI = 'https://dev.azure.com/org/_apis/oidctoken';
  await withSpawnSyncSpy(async (calls) => {
    await main.run(fixtureInstallerDir);

    assert.strictEqual(mockTl.result.result, mockTl.TaskResult.Succeeded, mockTl.result.message);
    assert.strictEqual(calls[0].options.env.INPUT_APIKEY, undefined);
    assert.strictEqual(calls[0].options.env.CLOUDSMITH_API_KEY, undefined);
    assert.strictEqual(calls[0].options.env.SYSTEM_ACCESSTOKEN, undefined);
    assert.strictEqual(calls[0].options.env.SYSTEM_OIDCREQUESTURI, undefined);
    assert.ok(calls[0].secretsAtCall.includes('test-key'), 'apiKey masked before the installer ran');
  });
});

test('installCli runs install.ps1 through PowerShell on Windows', () => {
  const platform = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', { value: 'win32' });
  try {
    withSpawnSyncSpy((calls) => {
      const installation = main.installCli('1.2.3', 'C:\\tools', fixtureInstallerDir);

      assert.strictEqual(calls[0].command, 'pwsh');
      assert.ok(calls[0].args.includes(path.join(fixtureInstallerDir, 'install.ps1')));
      assert.deepStrictEqual(calls[0].args.slice(-4), ['-Version', '1.2.3', '-InstallRoot', 'C:\\tools']);
      assert.strictEqual(installation.executable, '/opt/c/cloudsmith');
    });
  } finally {
    Object.defineProperty(process, 'platform', platform);
  }
});
