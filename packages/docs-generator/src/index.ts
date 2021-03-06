import { exec } from 'child_process';

const executeCommand = (pkgName, entryPoint = 'index', wholeModule = false, modeHtml = false) => {
  const entry = wholeModule ? `../${pkgName}/src` : `../${pkgName}/src/${entryPoint}`;
  const mode = modeHtml ? 'html' : 'md';
  const modeFlags = modeHtml
    ? '--plugin none'
    : `--entryDocument ${entryPoint.split('.')[0]}.md --hideInPageTOC`;

  exec(
    `yarn command ${entry} --tsconfig ../${pkgName}/tsconfig.json --json data/${pkgName}.json --out data/${mode}/${pkgName} ${modeFlags}`,
    (error, stdout, stderr) => {
      if (error && error.message && error.message.length > 0) {
        console.error(error.message);
      } else if (stderr && stderr.length > 0) {
        console.error(stderr);
      }
      console.log(
        `Successful extraction of ${entryPoint} from ${pkgName}! [${mode.toUpperCase()}]`
      );
    }
  );
};

// HTML
executeCommand('expo-mail-composer', 'MailComposer.ts', false, true);
executeCommand('expo-sensors', 'index.ts', true, true);
executeCommand('expo-barcode-scanner', 'BarCodeScanner.tsx', false, true);
executeCommand('expo-random', 'Random.ts', false, true);

// MD
executeCommand('expo-mail-composer', 'MailComposer.ts');
executeCommand('expo-sensors', 'index.ts', true);
executeCommand('expo-barcode-scanner', 'BarCodeScanner.tsx');
executeCommand('expo-random', 'Random.ts');
