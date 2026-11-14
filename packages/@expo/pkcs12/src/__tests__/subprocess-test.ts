import { ChildProcess, execFile } from 'child_process';
import { PassThrough } from 'stream';

import { parseInSubprocess } from '../subprocess';

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  execFile: jest.fn(),
}));

it('preserves the cause of an asynchronous parser process failure', async () => {
  const error = Object.assign(new Error('spawn node ENOENT'), { code: 'ENOENT' });
  jest.mocked(execFile).mockImplementation((_file, _args, _options, callback) => {
    callback!(error, '', '');
    return Object.assign(new ChildProcess(), { stdin: new PassThrough() });
  });
  await expect(parseInSubprocess(Buffer.from('container'), 'secret')).rejects.toThrow(/ENOENT/);
});
