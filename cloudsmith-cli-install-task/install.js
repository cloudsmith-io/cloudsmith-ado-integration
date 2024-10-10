const tl = require('azure-pipelines-task-lib/task');
const exec = require('child_process').exec;

function installCloudsmithCLI(version) {
  return new Promise((resolve, reject) => {
    // If version is specified, use that version. Otherwise, install the latest.
    const installCmd = version
      ? `pip install cloudsmith-cli==${version}`
      : 'pip install cloudsmith-cli';

    console.log(`Installing Cloudsmith CLI ${version ? 'version ' + version : '(latest version)'}...`);

    exec(installCmd, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
      } else if (stderr) {
        console.error(`Stderr: ${stderr}`);
        resolve(stdout);
      } else {
        console.log(`Stdout: ${stdout}`);
        resolve(stdout);
      }
    });
  });
}

function run() {
  const cliVersion = tl.getInput('cliVersion', false); // Get the CLI version, if provided

  installCloudsmithCLI(cliVersion)
    .then((message) => {
      console.log(message);
      tl.setResult(tl.TaskResult.Succeeded, 'Cloudsmith CLI installed successfully.');
    })
    .catch((error) => {
      console.error(error);
      tl.setResult(tl.TaskResult.Failed, error);
    });
}

run();