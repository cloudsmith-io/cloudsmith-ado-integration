const tl = require('azure-pipelines-task-lib/task');
const exec = require('child_process').exec;

async function run() {
  try {
    // Get the user-specified CLI version from the task input, if provided
    const cliVersion = tl.getInput('cliVersion', false);
    //false=optional
    let installCmd = 'pip install cloudsmith-cli';
    // Default to latest version
    
    // If a version is specified, add it to the installation command
    if (cliVersion) {
      installCmd = `pip install cloudsmith-cli==${cliVersion}`;
    }

    console.log(`Installing Cloudsmith CLI... Command: ${installCmd}`);

    exec(installCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        tl.setResult(tl.TaskResult.Failed, error.message);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Stdout: ${stdout}`);
      tl.setResult(tl.TaskResult.Succeeded, 'Cloudsmith CLI installed successfully.');
    });
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();