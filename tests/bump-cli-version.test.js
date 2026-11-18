'use strict';

const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');

const bumpScript = path.join(__dirname, '..', 'scripts', 'bump-cli-version.js');
const releasesUrl = 'https://github.com/cloudsmith-io/cloudsmith-ado-integration/releases/tag';
const today = new Date().toISOString().slice(0, 10);
let repositoryRoot;

const fixtures = {
  'cloudsmith-task/task.json': `{
  "name": "CloudsmithCliSetupAndAuthenticate",
  "visibility": ["Build", "Release"],
  "version": {
    "Major": 2,
    "Minor": 1,
    "Patch": 0
  },
  "inputs": [
    {
      "name": "cliVersion",
      "defaultValue": "1.31.3"
    }
  ]
}
`,
  'cloudsmith-task/package.json': `{
  "name": "cloudsmith-ado-extension",
  "version": "2.1.0"
}
`,
  'cloudsmith-task/package-lock.json': `{
  "name": "cloudsmith-ado-extension",
  "version": "2.1.0",
  "packages": {
    "": {
      "name": "cloudsmith-ado-extension",
      "version": "2.1.0"
    },
    "node_modules/dependency": {
      "version": "2.1.0"
    }
  }
}
`,
  'vss-extension.json': `{
  "id": "CloudsmithCliSetupAndAuthenticate",
  "version": "2.1.0"
}
`,
  'CHANGELOG.md': `# Changelog

---

## [Unreleased]
### 🚀 Changed
- **An unreleased change**
  Details.

---

## [2.1.0] - 2026-09-24
### ✨ Added
- **An earlier change**

---

[2.1.0]: ${releasesUrl}/v2.1.0
`,
};

function bump(version) {
  return spawnSync(process.execPath, [bumpScript, version], { cwd: repositoryRoot, encoding: 'utf8' });
}

function readFiles() {
  return Object.fromEntries(
    Object.keys(fixtures).map((name) => [name, fs.readFileSync(path.join(repositoryRoot, name), 'utf8')]),
  );
}

beforeEach(() => {
  repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bump-cli-version-'));
  fs.mkdirSync(path.join(repositoryRoot, 'cloudsmith-task'));
  for (const [name, content] of Object.entries(fixtures)) {
    fs.writeFileSync(path.join(repositoryRoot, name), content);
  }
});

afterEach(() => {
  fs.rmSync(repositoryRoot, { recursive: true, force: true });
});

test('a CLI bump with unreleased changes is a minor release that includes them', () => {
  const result = bump('1.32.0');

  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(result.stdout, '2.2.0\n');
  const files = readFiles();
  assert.strictEqual(
    files['cloudsmith-task/task.json'],
    fixtures['cloudsmith-task/task.json']
      .replace('"Minor": 1', '"Minor": 2')
      .replace('"defaultValue": "1.31.3"', '"defaultValue": "1.32.0"'),
  );
  assert.strictEqual(
    files['cloudsmith-task/package.json'],
    fixtures['cloudsmith-task/package.json'].replace('2.1.0', '2.2.0'),
  );
  assert.strictEqual(
    files['cloudsmith-task/package-lock.json'],
    fixtures['cloudsmith-task/package-lock.json'].replace('2.1.0', '2.2.0').replace('2.1.0', '2.2.0'),
  );
  assert.strictEqual(files['vss-extension.json'], fixtures['vss-extension.json'].replace('2.1.0', '2.2.0'));
  assert.strictEqual(
    files['CHANGELOG.md'],
    `# Changelog

---

## [Unreleased]

---

## [2.2.0] - ${today}
### 🚀 Changed
- **Cloudsmith CLI 1.32.0**
  The \`cliVersion\` input defaults to Cloudsmith CLI 1.32.0.
- **An unreleased change**
  Details.

---

## [2.1.0] - 2026-09-24
### ✨ Added
- **An earlier change**

---

[2.2.0]: ${releasesUrl}/v2.2.0
[2.1.0]: ${releasesUrl}/v2.1.0
`,
  );
});

test('a CLI bump without unreleased changes is a patch release', () => {
  bump('1.32.0');
  const result = bump('1.33.0');

  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(result.stdout, '2.2.1\n');
  const files = readFiles();
  assert.match(files['cloudsmith-task/task.json'], /"Minor": 2,\n {4}"Patch": 1\n/);
  assert.match(files['cloudsmith-task/task.json'], /"defaultValue": "1\.33\.0"/);
  assert.match(
    files['CHANGELOG.md'],
    new RegExp(
      `## \\[Unreleased\\]\n\n---\n\n## \\[2\\.2\\.1\\] - ${today}\n### 🚀 Changed\n` +
        '- \\*\\*Cloudsmith CLI 1\\.33\\.0\\*\\*\n.*\n\n---\n\n## \\[2\\.2\\.0\\]',
    ),
  );
  assert.match(files['CHANGELOG.md'], new RegExp(`^\\[2\\.2\\.1\\]: ${releasesUrl}/v2\\.2\\.1$`, 'm'));
});

for (const [description, version, reason] of [
  ['the pinned version', '1.31.3', /already pins Cloudsmith CLI 1\.31\.3/],
  ['an older version', '1.30.0', /already pins Cloudsmith CLI 1\.31\.3/],
  ['a new major version', '2.0.0', /different major version/],
]) {
  test(`${description} changes nothing`, () => {
    const result = bump(version);

    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(result.stdout, '');
    assert.match(result.stderr, reason);
    assert.deepStrictEqual(readFiles(), fixtures);
  });
}

test('a version that is not MAJOR.MINOR.PATCH is rejected', () => {
  const result = bump('latest');

  assert.notStrictEqual(result.status, 0);
  assert.deepStrictEqual(readFiles(), fixtures);
});
