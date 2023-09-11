import chalk from 'chalk';
import jestExpect from 'expect';

export function reportMagic({ testName, failed, results, failures }) {
  const formatResults = (results) =>
    results &&
    results
      .replace(/---/g, chalk.cyan('---'))
      .split('+++')
      .join(chalk.red('+++'))
      .split(` ${testName} `)
      .join(chalk.magenta.bold(` ${testName} `))
      .replace(/toBe:\s/g, chalk.bold.green('toBe: '));

  console.log(`\n${chalk.bgMagenta.bold.black(` RESULTS `)}\n\n${formatResults(results)}`);

  if (failed > 0) {
    console.log(`\n${chalk.bgRed.bold.black(` FAILED `)}\n\n${formatResults(failures)}`);
  }
}

export function expectResults({ testName, input }) {
  const { magic, failed, failures, results } = JSON.parse(input);
  jestExpect(results).toBeDefined();

  reportMagic({
    testName,
    failed,
    results,
    failures,
  });

  jestExpect(magic).toBe('[TEST-SUITE-END]');
  jestExpect(failed).toBe(0);
}
