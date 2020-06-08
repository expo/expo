import { Webpack } from '@expo/xdl';
import path from 'path';

async function main(args: any[]) {
  const projectRoot = path.resolve(args[0]);
  console.log('Building', projectRoot);
  try {
    await Webpack.bundleAsync(projectRoot, {
      nonInteractive: true,
      mode: 'production',
    });
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
