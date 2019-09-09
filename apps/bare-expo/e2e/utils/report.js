import chalk from 'chalk';

export function reportMagic({ testName, failed, results, failures }) {
  const formatResults = results =>
    results &&
    results
      // Remove random "undefined" from beginning
      .substring(9)
      .replace(/---/g, chalk.cyan('---'))
      .split('+++')
      .join(chalk.red('+++'))
      .split(` ${testName} `)
      .join(chalk.magenta.bold(` ${testName} `))
      .replace(/toBe:\s/g, chalk.bold.green('toBe: '));
  console.log(chalk.bgMagenta.bold.black(`\n RESULTS \n\n`), formatResults(results));

  if (failed > 0) {
    console.log(chalk.bgRed.bold.black('\n FAILED \n\n'), formatResults(failures));
  }
}

export function expectResults({ testName, input }) {
  const { magic, failed, failures, results } = JSON.parse(input);
  expect(magic).toBe('[TEST-SUITE-END]');
  expect(results).toBeDefined();

  reportMagic({
    testName,
    failed,
    results,
    failures,
  });

  expect(failed).toBe(0);
}
