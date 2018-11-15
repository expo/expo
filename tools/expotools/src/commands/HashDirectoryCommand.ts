import { HashDirectory } from '../expotools';

async function action(options) {
  let hash;
  if (options.withVersions) {
    hash = await HashDirectory.hashDirectoryWithVersionsAsync(process.cwd());
  } else {
    hash = await HashDirectory.hashDirectoryAsync(process.cwd());
  }
  console.log(hash);
}

export default (program: any) => {
  program
    .command('hash-directory')
    .option(
      '--with-versions',
      'Hash the directory and include versions of Yarn and Node in the input.'
    )
    .description('Returns a hash of the current directory')
    .asyncAction(action);
};
