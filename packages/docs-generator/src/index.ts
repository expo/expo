import { exec } from 'child_process';

const executeCommand = (pkgName, entryPoint = 'index', wholeModule = false) => {
  const entry = wholeModule ? `../${pkgName}/src` : `../${pkgName}/src/${entryPoint}`;
  const docsPath = '../../docs/data';

  exec(
    `yarn command ${entry} --tsconfig ../${pkgName}/tsconfig.json --json ${docsPath}/${pkgName}.json --out ${docsPath}/${pkgName} --plugin none`,
    (error, stdout, stderr) => {
      if (error && error.message && error.message.length > 0) {
        console.error(error.message);
      } else if (stderr && stderr.length > 0) {
        console.error(stderr);
      }
      console.log(`Successful extraction of ${entryPoint} from ${pkgName}!`);
    }
  );
};

executeCommand('expo-mail-composer', 'MailComposer.ts');

// TODO
// executeCommand('expo-sensors', 'index.ts', true);
// executeCommand('expo-barcode-scanner', 'BarCodeScanner.tsx');
// executeCommand('expo-random', 'Random.ts');
