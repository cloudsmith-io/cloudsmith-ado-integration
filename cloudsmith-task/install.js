const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch').default;
const tl = require('azure-pipelines-task-lib/task');
const os = require('os');

// Define constants for URL construction
const BASE_URL = 'https://dl.cloudsmith.io/public';
const NAMESPACE = 'cloudsmith';
const REPO_NAME = 'cli-zipapp';

// Define the destination path for the executable
const EXECUTABLE_PATH = os.platform() === 'win32'
  ? path.join(process.env['USERPROFILE'], 'cloudsmith-cli.pyz')
  : '/usr/local/bin/cloudsmith-cli.pyz';

// Helper function to download a file and set permissions
async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading Cloudsmith CLI from ${url}...`);
    fetch(url)
      .then((res) => {
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
    if (os.platform() !== 'win32') {
      fs.chmodSync(dest, '755'); // Make executable on non-Windows platforms
    }
  });
}

// Move the cloudsmith-cli.pyz file to the correct location and create a batch file for Windows
function moveToSystemPath() {
  return new Promise((resolve, reject) => {
    const targetPath = os.platform() === 'win32'
      ? path.join(process.env['USERPROFILE'], 'cloudsmith.bat')
      : '/usr/local/bin/cloudsmith';

    try {
      if (fs.existsSync(targetPath)) {
        console.log(`Removing existing Cloudsmith CLI from ${targetPath}...`);
        fs.unlinkSync(targetPath); // Remove existing file
      }

      console.log(`Moving Cloudsmith CLI to ${targetPath}...`);
      if (os.platform() === 'win32') {
        const pyzTargetPath = path.join(process.env['USERPROFILE'], 'cloudsmith-cli.pyz');
        fs.renameSync(EXECUTABLE_PATH, pyzTargetPath);

        const batContent = `@echo off\npython ${pyzTargetPath} %*`;
        fs.writeFileSync(targetPath, batContent);
        console.log(`Batch file created at ${targetPath}`);

        // Add the batch file directory to PATH
        tl.setVariable('PATH', `${path.dirname(targetPath)};${process.env.PATH}`);
      } else {
        fs.renameSync(EXECUTABLE_PATH, targetPath); // Non-Windows move
      }

      resolve();
    } catch (error) {
      reject(`Unable to move Cloudsmith CLI to ${targetPath}: ${error.message}`);
    }
  });
}

// Helper function to construct the download URL based on version
function getDownloadUrl(version) {
  return version && version !== ''
    ? `${BASE_URL}/${NAMESPACE}/${REPO_NAME}/raw/names/cloudsmith-cli/versions/${version}/cloudsmith.pyz`
    : `${BASE_URL}/${NAMESPACE}/${REPO_NAME}/raw/names/cloudsmith-cli/versions/latest/cloudsmith.pyz`;
}

// Download the Cloudsmith CLI and move to the correct path
async function downloadCli(version) {
  const downloadUrl = getDownloadUrl(version);
  await downloadFile(downloadUrl, EXECUTABLE_PATH);
  await moveToSystemPath(); // Move to system path after downloading
}

// Install the CLI based on version or latest
async function installCli(cliVersion) {
  try {
    console.log(
      cliVersion
        ? `Installing Cloudsmith CLI version ${cliVersion}...`
        : 'Installing the latest version of Cloudsmith CLI...'
    );
    await downloadCli(cliVersion);
    console.log('Cloudsmith CLI installed successfully.');
  } catch (error) {
    tl.setResult(tl.TaskResult.Failed, `Failed to install the CLI: ${error.message}`);
  }
}

module.exports = {
  installCli,
};