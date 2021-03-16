import { exec } from 'child_process';

const executeCommand = (pkgName, entryPoint = 'index', wholeModule = false, modeHtml = false, json = false) => {
  const entry = wholeModule ? `../${pkgName}/src` : `../${pkgName}/src/${entryPoint}`;
  const mode = modeHtml ? 'html' : 'md';
  const modeFlags = modeHtml
    ? '--plugin none'
    : `--entryDocument ${entryPoint.split('.')[0]}.md --hidePageTitle true --hideInPageTOC true --hideBreadcrumbs true --publicPath ./`;
  const docsPath = '../../docs/data';
  // const docsPath = '../../docs/pages/versions/unversioned/partials';
  // const exportJson = json ? ' --json ${docsPath}/${pkgName}.json' : '';

  exec(
    `yarn command ${entry} --tsconfig ../${pkgName}/tsconfig.json --json ${docsPath}/${pkgName}.json --out ${docsPath}/${pkgName} ${modeFlags}`,
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

executeCommand('expo-mail-composer', 'MailComposer.ts', false, false, true);
// executeCommand('expo-sensors', 'index.ts', true);
// executeCommand('expo-barcode-scanner', 'BarCodeScanner.tsx');
// executeCommand('expo-random', 'Random.ts');
