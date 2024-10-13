const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch').default;
const tl = require('azure-pipelines-task-lib/task');
const exec = require('child_process').exec;

// Define constants for URL construction
const BASE_URL = 'https://dl.cloudsmith.io/public';
const NAMESPACE = 'cloudsmith';
const REPO_NAME = 'cli-zipapp';

// Define the destination path for the executable
const EXECUTABLE_PATH = '/usr/local/bin/cloudsmith-cli.pyz';

// Helper function to download a file and set permissions
async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading Cloudsmith CLI from ${url}...`);
    fetch(url)
      .then(res => {
        if (!res.ok) {
          reject(new Error(`Failed to fetch ${url}: ${res.statusText}`));
        } else {
          const fileStream = fs.createWriteStream(dest);
          res.body.pipe(fileStream);
          res.body.on('error', reject);
          fileStream.on('finish', resolve);
        }
      })
      .catch(reject);
  }).then(() => {
    fs.chmodSync(dest, '755');  // Make the file executable
  });
}

// Move the cloudsmith-cli.pyz file to /usr/local/bin
function moveToSystemPath() {
  return new Promise((resolve, reject) => {
    const targetPath = '/usr/local/bin/cloudsmith';
    try {
      if (fs.existsSync(targetPath)) {
        console.log('Removing existing Cloudsmith CLI from /usr/local/bin...');
        fs.unlinkSync(targetPath);  // Remove existing file
      }
      console.log(`Moving Cloudsmith CLI to /usr/local/bin...`);
      fs.renameSync(EXECUTABLE_PATH, targetPath);
      resolve();
    } catch (error) {
      reject(`Unable to move Cloudsmith CLI to /usr/local/bin: ${error.message}`);
    }
  });
}

// Download the latest release of the CLI
async function downloadLatestRelease() {
  const downloadUrl = `${BASE_URL}/${NAMESPACE}/${REPO_NAME}/raw/names/cloudsmith-cli/versions/latest/cloudsmith.pyz`;
  await downloadFile(downloadUrl, EXECUTABLE_PATH);
  await moveToSystemPath();  // Move it to /usr/local/bin after downloading
}

// Install the CLI via pip (when version is specified)
function installCliViaPip(version) {
  const cliPackage = `cloudsmith-cli==${version}`;
  return new Promise((resolve, reject) => {
    exec(`pip install ${cliPackage}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Failed to install the CLI via pip: ${stderr}`);
      } else {
        console.log(stdout);
        resolve();
      }
    });
  });
}

// Install the CLI either via pip if the user specifies a version, or by downloading the latest release
async function installCli(cliVersion) {
  if (cliVersion && cliVersion !== '') {
    console.log(`Installing Cloudsmith CLI version ${cliVersion} using pip...`);
    try {
      await installCliViaPip(cliVersion); // If version is specified, install via pip
    } catch (error) {
      tl.setResult(tl.TaskResult.Failed, `Failed to install CLI via pip: ${error}`);
    }
  } else {
    console.log('No version specified, downloading the latest Cloudsmith CLI version...');
    await downloadLatestRelease(); // No version specified, download the latest release
  }
}

module.exports = {
  installCli,
};