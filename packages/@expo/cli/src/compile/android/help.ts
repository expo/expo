import chalk from 'chalk';

export function getHelp(includeOptions = true): string {
  return [
    ...(includeOptions ? ['', chalk`  {bold Info}`] : [chalk`  {bold android}`]),
    '    Build the Android app binary locally',
    '',
    ...(includeOptions
      ? [
          chalk`  {bold Usage}`,
          chalk`    {dim $} npx expo compile:android {dim <dir>}`,
          '',
          chalk`  {bold Options}`,
          chalk`    <dir>                    Directory of the Expo project. {dim Default: Current working directory}`,
          '    --dev                    Build in development mode',
          '    --prod                   Build in production mode (default)',
          '    --device <device>        Device name or ID to build the app for',
          '    --output-dir <dir>       Directory to copy the built app to',
          '    --output-type <apk|aab>  Type of app binary to build',
          '    -h, --help               Usage info',
          '',
        ]
      : []),
    '  Build the app in development mode:',
    chalk`    {dim $} npx expo compile:android --dev`,
    '',
    '  Copy the built app into a folder in your project:',
    chalk`    {dim $} npx expo compile:android --dev --output-dir ./build`,
    '',
  ].join('\n');
}
