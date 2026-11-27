import { createForProject } from '@expo/package-manager';

import { lintAsync } from '../lintAsync';
import type { Options } from '../resolveOptions';

jest.mock('@expo/package-manager', () => ({ createForProject: jest.fn() }));
jest.mock('@expo/require-utils', () => ({
  resolveFrom: jest.fn(() => '/app/node_modules/eslint/lib/api.js'),
  loadModuleSync: jest.fn(() => ({ loadESLint: async () => ({ version: '9.0.0' }) })),
}));
jest.mock('../ESlintPrerequisite', () => ({
  ESLintProjectPrerequisite: jest.fn(() => ({ assertAsync: async () => true })),
}));
jest.mock('../../utils/nodeEnv', () => ({ loadEnvFiles: jest.fn() }));
jest.mock('../../utils/interactive', () => ({ isInteractive: () => true }));

const options = {
  projectRoot: '/app',
  ext: [],
  cache: true,
  fix: false,
  fixType: [],
  ignore: true,
  ignorePattern: [],
  quiet: false,
  maxWarnings: -1,
} as Options & { projectRoot: string };

let write: jest.SpyInstance;

beforeEach(() => {
  write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterEach(() => {
  write.mockRestore();
});

it('reports working while linting and done after', async () => {
  let writesWhileLinting: unknown[][] = [];
  jest.mocked(createForProject).mockReturnValue({
    runBinAsync: jest.fn(async () => {
      writesWhileLinting = [...write.mock.calls];
    }),
  } as unknown as ReturnType<typeof createForProject>);

  await lintAsync([], options);

  expect(writesWhileLinting).toEqual([
    ['\x1b]7501;state=working:app=expo:msg=TGludGluZw==:id=1\x1b\\'],
  ]);
  expect(write.mock.calls).toEqual([
    ['\x1b]7501;state=working:app=expo:msg=TGludGluZw==:id=1\x1b\\'],
    ['\x1b]7501;state=clear:id=1\x1b\\'],
    ['\x1b]7501;state=done:app=expo:msg=RmluaXNoZWQgbGludGluZw==\x1b\\'],
  ]);
});

it('reports error before exiting when lint finds problems', async () => {
  const exited = new Error('process exited');
  const processExit = jest.spyOn(process, 'exit').mockImplementation(() => {
    throw exited;
  });
  jest.mocked(createForProject).mockReturnValue({
    runBinAsync: jest.fn(async () => {
      throw Object.assign(new Error('eslint exited with non-zero code: 1'), { status: 1 });
    }),
  } as unknown as ReturnType<typeof createForProject>);

  try {
    await expect(lintAsync([], options)).rejects.toThrow(exited);

    expect(write.mock.calls).toEqual([
      ['\x1b]7501;state=working:app=expo:msg=TGludGluZw==:id=2\x1b\\'],
      ['\x1b]7501;state=clear:id=2\x1b\\'],
      ['\x1b]7501;state=error:app=expo:msg=TGludCBmb3VuZCBwcm9ibGVtcw==\x1b\\'],
    ]);
  } finally {
    processExit.mockRestore();
  }
});
