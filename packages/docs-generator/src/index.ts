import { exec } from 'child_process';
import fs from 'fs';

const dataPath = '../../docs/public/static/data/unversioned';

const executeCommand = (pkgName, entryPoint = 'index', wholeModule = false) => {
  const entry = wholeModule ? `../${pkgName}/src` : `../${pkgName}/src/${entryPoint}`;

  exec(
    `yarn command ${entry} --tsconfig ../${pkgName}/tsconfig.json --json ${dataPath}/${pkgName}.json --out ${dataPath}/${pkgName} --plugin none`,
    (error, stdout, stderr) => {
      if (error && error.message && error.message.length > 0) {
        console.error(error.message);
      } else if (stderr && stderr.length > 0) {
        console.error(stderr);
      }
      console.log(`Successful extraction of ${entryPoint} from ${pkgName}!`);

      // Currently there is no option to skip HTML generation, so we need to remove the files
      const htmlContentPath = `${dataPath}/${pkgName}`;
      try {
        fs.rmdirSync(htmlContentPath, { recursive: true });
        console.log(`${htmlContentPath} is deleted!`);
      } catch (err) {
        console.error(`Error while deleting ${htmlContentPath}.`);
      }
    }
  );
};

executeCommand('expo-mail-composer', 'MailComposer.ts');

// TODO
// executeCommand('expo-sensors', 'index.ts', true);
// executeCommand('expo-barcode-scanner', 'BarCodeScanner.tsx');
// executeCommand('expo-random', 'Random.ts');
