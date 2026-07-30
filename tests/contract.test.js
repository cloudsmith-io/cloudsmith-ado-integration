'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const repositoryRoot = path.join(__dirname, '..');
const extensionManifest = readJson('vss-extension.json');
const taskManifest = readJson('cloudsmith-task/task.json');
const taskPackage = readJson('cloudsmith-task/package.json');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8'));
}

function taskVersion() {
  const { Major, Minor, Patch } = taskManifest.version;
  return `${Major}.${Minor}.${Patch}`;
}

test('extension and task identities remain stable across major upgrades', () => {
  assert.strictEqual(extensionManifest.publisher, 'Cloudsmith');
  assert.strictEqual(extensionManifest.id, 'CloudsmithCliSetupAndAuthenticate');
  assert.strictEqual(taskManifest.id, '06C63887-BA6C-4F36-8BB5-34A817634C29');
  assert.strictEqual(taskManifest.name, 'CloudsmithCliSetupAndAuthenticate');
});

test('extension, task, and package versions remain aligned', () => {
  assert.strictEqual(taskManifest.version.Major, 2);
  assert.strictEqual(taskVersion(), extensionManifest.version);
  assert.strictEqual(taskPackage.version, extensionManifest.version);
});

test('version 2 retains the common version 1 migration inputs', () => {
  const inputNames = new Set(taskManifest.inputs.map(({ name }) => name));
  for (const name of ['cliVersion', 'authMethod', 'oidcNamespace', 'oidcServiceSlug', 'apiKey']) {
    assert.ok(inputNames.has(name), `missing stable input: ${name}`);
  }
});

test('version 2 does not reintroduce removed compatibility inputs', () => {
  const inputNames = new Set(taskManifest.inputs.map(({ name }) => name));
  for (const name of ['pipInstall', 'oidcAuthOnly']) {
    assert.ok(!inputNames.has(name), `removed input must not be restored: ${name}`);
  }
  assert.deepStrictEqual(Object.keys(taskPackage.dependencies), ['azure-pipelines-task-lib']);
});
