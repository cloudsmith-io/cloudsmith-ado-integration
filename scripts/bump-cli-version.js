'use strict';

// Pins the default cliVersion input to a new Cloudsmith CLI release and
// records the change as a release of the extension in CHANGELOG.md. The
// release is a patch release, or a minor release that also includes the
// entries under [Unreleased] when there are any.
// Prints the new extension version. Prints nothing when task.json already
// pins that version or a newer one, or when the release has a different
// major version, because a new CLI major needs a new task major.
// Usage: node scripts/bump-cli-version.js CLI_VERSION

const fs = require('node:fs');

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const CHANGED_HEADING = '### 🚀 Changed';
const RELEASES_URL = 'https://github.com/cloudsmith-io/cloudsmith-ado-integration/releases/tag';
const TASK_MANIFEST = 'cloudsmith-task/task.json';

function parseVersion(version) {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`'${version}' is not MAJOR.MINOR.PATCH`);
  }
  return version.split('.').map(Number);
}

function isNewer(candidate, current) {
  const candidateParts = parseVersion(candidate);
  const currentParts = parseVersion(current);
  const index = candidateParts.findIndex((part, position) => part !== currentParts[position]);
  return index !== -1 && candidateParts[index] > currentParts[index];
}

function refusalReason(pinnedVersion, cliVersion) {
  if (!isNewer(cliVersion, pinnedVersion)) {
    return `${TASK_MANIFEST} already pins Cloudsmith CLI ${pinnedVersion}`;
  }
  if (parseVersion(cliVersion)[0] !== parseVersion(pinnedVersion)[0]) {
    return `Cloudsmith CLI ${cliVersion} has a different major version than the pinned Cloudsmith CLI ${pinnedVersion}`;
  }
  return null;
}

function findLine(lines, predicate, description) {
  const index = lines.findIndex(predicate);
  if (index === -1) {
    throw new Error(`no ${description} in CHANGELOG.md`);
  }
  return index;
}

function unreleasedBounds(lines) {
  const start = findLine(lines, (line) => line === '## [Unreleased]', '[Unreleased] section');
  const end = findLine(lines, (line, index) => index > start && line.startsWith('## ['), 'released version');
  return { start, end };
}

function hasUnreleasedChanges(changelog) {
  const lines = changelog.split('\n');
  const { start, end } = unreleasedBounds(lines);
  return lines.slice(start + 1, end).some((line) => line !== '' && line !== '---');
}

function nextExtensionVersion(currentVersion, minorRelease) {
  const [major, minor, patch] = parseVersion(currentVersion);
  return minorRelease ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
}

function releaseChangelog(changelog, extensionVersion, cliVersion) {
  const lines = changelog.split('\n');
  const linkIndex = findLine(lines, (line) => /^\[\d+\.\d+\.\d+\]: /.test(line), 'release link');
  lines.splice(linkIndex, 0, `[${extensionVersion}]: ${RELEASES_URL}/v${extensionVersion}`);

  const { start, end } = unreleasedBounds(lines);
  const section = lines.slice(start + 1, end);
  const entry = [
    `- **Cloudsmith CLI ${cliVersion}**`,
    `  The \`cliVersion\` input defaults to Cloudsmith CLI ${cliVersion}.`,
  ];
  const changedIndex = section.indexOf(CHANGED_HEADING);
  if (changedIndex === -1) {
    section.unshift(CHANGED_HEADING, ...entry);
  } else {
    section.splice(changedIndex + 1, 0, ...entry);
  }
  const today = new Date().toISOString().slice(0, 10);
  const released = ['## [Unreleased]', '', '---', '', `## [${extensionVersion}] - ${today}`, ...section];
  lines.splice(start, end - start, ...released);
  return lines.join('\n');
}

function setVersions(text, version, count) {
  let remaining = count;
  return text.replace(/"version": "[^"]*"/g, (match) => {
    remaining -= 1;
    return remaining >= 0 ? `"version": "${version}"` : match;
  });
}

function updateFile(path, update) {
  fs.writeFileSync(path, update(fs.readFileSync(path, 'utf8')));
}

function main(args) {
  const cliVersion = args[0] || '';
  if (!VERSION_PATTERN.test(cliVersion)) {
    console.error('usage: node scripts/bump-cli-version.js MAJOR.MINOR.PATCH');
    return 1;
  }
  const taskManifest = JSON.parse(fs.readFileSync(TASK_MANIFEST, 'utf8'));
  const pinnedVersion = taskManifest.inputs.find(({ name }) => name === 'cliVersion').defaultValue;
  const refusal = refusalReason(pinnedVersion, cliVersion);
  if (refusal) {
    console.error(refusal);
    return 0;
  }

  const currentVersion = JSON.parse(fs.readFileSync('vss-extension.json', 'utf8')).version;
  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
  const extensionVersion = nextExtensionVersion(currentVersion, hasUnreleasedChanges(changelog));
  const [, minor, patch] = parseVersion(extensionVersion);

  updateFile(TASK_MANIFEST, (text) =>
    text
      .replace(`"defaultValue": "${pinnedVersion}"`, `"defaultValue": "${cliVersion}"`)
      .replace(/"Minor": \d+/, `"Minor": ${minor}`)
      .replace(/"Patch": \d+/, `"Patch": ${patch}`),
  );
  updateFile('vss-extension.json', (text) => setVersions(text, extensionVersion, 1));
  updateFile('cloudsmith-task/package.json', (text) => setVersions(text, extensionVersion, 1));
  // The root package and its packages[""] entry are the first two versions in the lockfile.
  updateFile('cloudsmith-task/package-lock.json', (text) => setVersions(text, extensionVersion, 2));
  fs.writeFileSync('CHANGELOG.md', releaseChangelog(changelog, extensionVersion, cliVersion));
  console.log(extensionVersion);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
