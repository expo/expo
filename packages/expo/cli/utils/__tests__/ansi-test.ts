import chalk from 'chalk';

import { stripAnsi } from '../ansi';

describe(stripAnsi, () => {
  it(`strips ansi`, () => {
    expect(stripAnsi()).toEqual(undefined);
    expect(stripAnsi(`\u001B[0m`)).toEqual('');
    expect(stripAnsi(chalk`{bold hey} {underline you}`)).toEqual('hey you');
  });
});
