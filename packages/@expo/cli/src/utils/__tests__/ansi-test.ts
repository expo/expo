import { styleText } from 'node:util';

import { stripAnsi } from '../ansi';

describe(stripAnsi, () => {
  it(`strips ansi`, () => {
    expect(stripAnsi()).toEqual(undefined);
    expect(stripAnsi(`\u001B[0m`)).toEqual('');
    expect(stripAnsi(`${styleText('bold', 'hey')} ${styleText('underline', 'you')}`)).toEqual(
      'hey you'
    );
  });
});
