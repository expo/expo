import { fs, vol } from 'memfs';

import * as Log from '../../log';
import { FileNotifier } from '../FileNotifier';

jest.mock('../../log');

const originalCwd = process.cwd();

beforeEach(() => {
  vol.reset();
});

beforeAll(() => {
  process.chdir('/');
  // @ts-expect-error
  fs.watchFile = jest.fn(fs.watchFile);
});

afterAll(() => {
  process.chdir(originalCwd);
});

it('returns null when no files can be found', () => {
  vol.fromJSON({}, '/');
  const fileNotifier = new FileNotifier('./', ['babel.config.js']);
  expect(fileNotifier.startObserving()).toBe(null);
});

it('observes the first existing file', () => {
  jest
    .mocked(fs.watchFile)
    // @ts-expect-error
    .mockImplementationOnce((_, callback) => {
      // @ts-expect-error: polymorphism
      callback({}, { size: 1 });
    });

  vol.fromJSON(
    {
      'babel.config.js': '',
    },
    '/'
  );
  const fileNotifier = new FileNotifier(
    './',
    [
      // Skips this file
      '.babelrc',
      // Starts observing
      'babel.config.js',
    ],
    { additionalWarning: ' foobar' }
  );
  expect(fileNotifier.startObserving()).toBe('/babel.config.js');

  // We mock out the callback firing and test that a warning was logged.
  expect(Log.log).toBeCalledTimes(1);
  expect(Log.log).toBeCalledWith(expect.stringContaining('babel.config.js'));
  expect(Log.log).toBeCalledWith(expect.stringContaining('foobar'));
});
