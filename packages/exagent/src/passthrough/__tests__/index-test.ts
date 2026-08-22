import { vol } from 'memfs';
import path from 'path';

import { exagentExpoPassthrough } from '..';
import { event } from '../../events';
import { runExpoAsync } from '../../utils/expoCli';

jest.mock('../../log');
jest.mock('../../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../utils/expoCli', () => ({ runExpoAsync: jest.fn() }));

// path.resolve so the expectation matches what findUpProjectRootOrCwd returns on every
// platform (win32 resolves '/project' to '<drive>:\\project').
const projectRoot = path.resolve('/project');

beforeEach(() => {
  vol.reset();
  vol.fromJSON({ 'package.json': JSON.stringify({ name: 'app' }) }, projectRoot);
  jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);
  jest.mocked(runExpoAsync).mockResolvedValue(0);
  process.exitCode = undefined;
});

afterEach(() => {
  jest.restoreAllMocks();
  process.exitCode = undefined;
});

describe(exagentExpoPassthrough, () => {
  it(`should forward the command and its arguments to the expo CLI`, async () => {
    await exagentExpoPassthrough('prebuild')(['--clean']);

    expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['prebuild', '--clean']);
  });

  it(`should forward a command with no arguments`, async () => {
    await exagentExpoPassthrough('whoami')([]);

    expect(runExpoAsync).toHaveBeenCalledWith(projectRoot, ['whoami']);
  });

  it(`should forward the exit code of the expo CLI`, async () => {
    jest.mocked(runExpoAsync).mockResolvedValue(9);

    await exagentExpoPassthrough('export')(['--platform', 'web']);

    expect(process.exitCode).toBe(9);
  });

  it(`should emit one event naming the forwarded command`, async () => {
    await exagentExpoPassthrough('export')(['--platform', 'web']);

    expect(event).toHaveBeenCalledWith('expo_passthrough', {
      command: 'export',
      args: ['--platform', 'web'],
    });
  });

  it(`should run in the working directory when it is inside no project`, async () => {
    vol.reset();
    jest.spyOn(process, 'cwd').mockReturnValue('/elsewhere');

    await exagentExpoPassthrough('whoami')([]);

    expect(runExpoAsync).toHaveBeenCalledWith('/elsewhere', ['whoami']);
  });
});
