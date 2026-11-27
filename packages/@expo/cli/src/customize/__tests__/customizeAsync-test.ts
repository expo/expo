import { withProgramStatus } from '../../utils/programStatus';
import { customizeAsync } from '../customizeAsync';
import { queryAndGenerateAsync } from '../generate';

jest.mock('@expo/config', () => ({ getConfig: jest.fn(() => ({ exp: {} })) }));
jest.mock('../../start/server/metro/router', () => ({
  getRouterDirectoryModuleIdWithManifest: jest.fn(() => 'app'),
}));
jest.mock('../../start/server/platformBundlers', () => ({
  getPlatformBundlers: jest.fn(() => ({ web: 'metro' })),
}));
jest.mock('../../utils/findUp', () => ({ findUpProjectRootOrAssert: jest.fn(() => '/app') }));
jest.mock('../../utils/nodeEnv', () => ({ loadEnvFiles: jest.fn() }));
jest.mock('../../utils/interactive', () => ({ isInteractive: () => true }));
jest.mock('../generate', () => ({
  queryAndGenerateAsync: jest.fn(),
  selectAndGenerateAsync: jest.fn(),
}));

it('reports done after generating files that install packages', async () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  jest
    .mocked(queryAndGenerateAsync)
    .mockImplementation(() => withProgramStatus({ state: 'working' }, async () => {}));

  try {
    await customizeAsync(['tsconfig.json'], {}, []);

    expect(write.mock.calls.at(-1)).toEqual([
      '\x1b]7501;state=done:app=expo:msg=RmluaXNoZWQgY3VzdG9taXppbmc=\x1b\\',
    ]);
  } finally {
    write.mockRestore();
  }
});
