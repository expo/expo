import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';


async function action(projectDir: string, { directory = './' }: { directory: string }) {
    
    async function getRevisionAsync(directory): Promise<string | undefined> {
        try {
            return (await spawnAsync('git', ['log', '-1', '--format=format:%H', `--full-diff`, `${directory.trim()}`], {
              cwd: projectDir,
            })).stdout;
    
          } catch (e) {
              console.error(e);
          }
          return;
    }

    const latestCommit = (await spawnAsync('git', ['rev-parse', 'HEAD'], {
        cwd: projectDir,
    })).stdout.trim();
    const targetCommit = await getRevisionAsync(directory);
    // console.log("compare", latestCommit, targetCommit);
    if (latestCommit === targetCommit) {
        return false;
    }
    return true;
}

export default (program: Command) => {
  program
    .command('was-modified [project-dir]')
    .description(`Returns if a directory was modified`)
    .option('-d, --directory <string>', 'Name of the module to check.')
    .asyncAction(action);
}
