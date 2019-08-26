const eslint = require('eslint');
const process = require('process');

if (require.main === module) {
  const [, , configString, ...filePatterns] = process.argv;
  const config = JSON.parse(configString);

  const cli = new eslint.CLIEngine(config);
  const report = cli.executeOnFiles(filePatterns);
  console.log(JSON.stringify(report));
}
