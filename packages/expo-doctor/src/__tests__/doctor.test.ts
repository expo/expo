import { InstalledDependencyVersionCheck } from '../checks/InstalledDependencyVersionCheck';
import { DoctorCheck } from '../checks/checks.types';
import {
  getChecksInScopeForProject,
  printCheckResultSummaryOnComplete,
  printFailedCheckIssueAndAdvice,
  runChecksAsync,
} from '../doctor';
import { Log } from '../utils/log';

jest.mock(`../utils/log`);

jest.mock('../utils/ora', () => ({
  logNewSection: jest.fn(() => ({
    fail: jest.fn(),
    succeed: jest.fn(),
  })),
}));

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '46.0.0',
  },
  pkg: {},
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

class MockSuccessfulCheck implements DoctorCheck {
  description = 'Mock successful check';
  sdkVersionRange = '*';
  runAsync = jest.fn(() => Promise.resolve({ isSuccessful: true, issues: [], advice: '' }));
}

class MockFailedCheck implements DoctorCheck {
  description = 'Mock failed check';
  sdkVersionRange = '*';
  runAsync = jest.fn(() =>
    Promise.resolve({ isSuccessful: false, issues: ['issue'], advice: 'advice' })
  );
}

class MockUnexpectedThrowCheck implements DoctorCheck {
  description = 'Mock failed check';
  sdkVersionRange = '*';
  runAsync = jest.fn(() => Promise.reject(new Error('Unexpected error thrown from check.')));
}

describe(getChecksInScopeForProject, () => {
  beforeEach(() => {
    delete process.env.EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK;
  });

  it('skips the InstalledDependencyVersionCheck if environment variable is set', async () => {
    process.env.EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK = '1';
    jest.mocked(Log.log).mockReset();
    const checks = getChecksInScopeForProject({
      name: 'foo',
      slug: 'foo',
      sdkVersion: 'UNVERSIONED',
    });
    expect(
      checks.find((check) => check instanceof InstalledDependencyVersionCheck)
    ).toBeUndefined();
    expect(jest.mocked(Log.log)).toHaveBeenCalledWith(
      expect.stringMatching(
        'Checking dependencies for compatibility with the installed Expo SDK version is disabled'
      )
    );
  });

  it('includes the InstalledDependencyVersionCheck if environment variable is not set', async () => {
    const checks = getChecksInScopeForProject({
      name: 'foo',
      slug: 'foo',
      sdkVersion: 'UNVERSIONED',
    });
    expect(
      checks.find((check) => check instanceof InstalledDependencyVersionCheck)
    ).not.toBeUndefined();
  });
});

describe(runChecksAsync, () => {
  it(`returns a DoctorCheckRunnerJob for each check`, async () => {
    const mockOnComplete = jest.fn();
    const result = await runChecksAsync(
      [new MockSuccessfulCheck(), new MockFailedCheck()],
      {
        projectRoot: '',
        ...additionalProjectProps,
      },
      mockOnComplete
    );
    expect(result.length).toBe(2);
  });

  it(`calls runAsync on each check with check params`, async () => {
    const mockOnComplete = jest.fn();
    const mockCheck = new MockSuccessfulCheck();
    await runChecksAsync(
      [mockCheck],
      {
        projectRoot: '',
        ...additionalProjectProps,
      },
      mockOnComplete
    );
    expect((mockCheck.runAsync.mock.calls as [any])[0][0]).toMatchObject({
      projectRoot: '',
      ...additionalProjectProps,
    });
  });

  it(`calls onComplete with result.isSuccessful = true when a check is successful`, async () => {
    const mockOnComplete = jest.fn();
    await runChecksAsync(
      [new MockSuccessfulCheck()],
      {
        projectRoot: '',
        ...additionalProjectProps,
      },
      mockOnComplete
    );
    expect(mockOnComplete.mock.calls[0][0]).toMatchObject({
      result: { isSuccessful: true },
    });
  });

  it(`calls onComplete with result.isSuccessful = false when a check is not successful`, async () => {
    const mockOnComplete = jest.fn();
    await runChecksAsync(
      [new MockFailedCheck()],
      {
        projectRoot: '',
        ...additionalProjectProps,
      },
      mockOnComplete
    );
    expect(mockOnComplete.mock.calls[0][0]).toMatchObject({
      result: { isSuccessful: false },
    });
  });

  it(`calls onComplete with result.isSuccessful = false and an error when a check throws unexpectedly`, async () => {
    const mockOnComplete = jest.fn();
    await runChecksAsync(
      [new MockUnexpectedThrowCheck()],
      {
        projectRoot: '',
        ...additionalProjectProps,
      },
      mockOnComplete
    );
    expect(mockOnComplete.mock.calls[0][0]).toMatchObject({
      result: { isSuccessful: false },
      error: expect.any(Error),
    });
  });
});

describe(printCheckResultSummaryOnComplete, () => {
  it(`Prints test description with checkmark if test is successful`, () => {
    jest.mocked(Log.log).mockReset();
    printCheckResultSummaryOnComplete({
      result: { isSuccessful: true, issues: [], advice: '' },
      check: new MockSuccessfulCheck(),
      duration: 0,
    });
    expect(jest.mocked(Log.log)).toHaveBeenCalledWith(
      expect.stringMatching('✔ Mock successful check')
    );
  });

  it(`Prints test description with x if test is not successful`, () => {
    jest.mocked(Log.log).mockReset();
    printCheckResultSummaryOnComplete({
      result: { isSuccessful: false, issues: [], advice: '' },
      check: new MockFailedCheck(),
      duration: 0,
    });
    expect(jest.mocked(Log.log)).toHaveBeenCalledWith(
      expect.stringContaining('✖ Mock failed check')
    );
  });

  it(`Prints error if check throws an unexpected error`, () => {
    jest.mocked(Log.error).mockReset();
    jest.mocked(Log.exception).mockReset();
    printCheckResultSummaryOnComplete({
      result: { isSuccessful: false, issues: [], advice: '' },
      check: new MockFailedCheck(),
      duration: 0,
      error: new Error('Some error'),
    });
    expect(jest.mocked(Log.error).mock.calls[0][0]).toContain('Unexpected error while running');
    expect(jest.mocked(Log.exception).mock.calls[0][0].message).toContain('Some error');
  });

  it(`Prints the error cause if check throws a network error`, () => {
    jest.mocked(Log.error).mockReset();
    jest.mocked(Log.exception).mockReset();
    const error = new Error('ENOTFOUND');
    // @ts-ignore
    error.cause = { code: 'ENOTFOUND' };
    // @ts-ignore
    error.cause.toString = () => 'ENOTFOUND';
    printCheckResultSummaryOnComplete({
      result: { isSuccessful: false, issues: [], advice: '' },
      check: new MockFailedCheck(),
      duration: 0,
      error,
    });
    expect(jest.mocked(Log.error).mock.calls[1][0]).toContain('ENOTFOUND');
  });
});

describe(printFailedCheckIssueAndAdvice, () => {
  it(`Does not print when check is successful`, () => {
    jest.mocked(Log.log).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: true, issues: [], advice: '' },
      check: new MockSuccessfulCheck(),
      duration: 0,
    });
    expect(jest.mocked(Log.log)).not.toHaveBeenCalled();
  });

  // these errors print in-line so they're easier to associate with the origianl check
  it(`Does not print when check throws an error`, () => {
    jest.mocked(Log.log).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: false, issues: [], advice: '' },
      check: new MockUnexpectedThrowCheck(),
      error: new Error('Some error'),
      duration: 0,
    });
    expect(jest.mocked(Log.log)).not.toHaveBeenCalled();
  });

  it(`Prints issues when check fails`, () => {
    jest.mocked(Log.warn).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: false, issues: ['issue1', 'issue2'], advice: '' },
      check: new MockFailedCheck(),
      duration: 0,
    });
    expect(jest.mocked(Log.warn).mock.calls[0][0]).toContain('issue1');
    expect(jest.mocked(Log.warn).mock.calls[1][0]).toContain('issue2');
  });
  it(`Prints advice when check fails if available`, () => {
    jest.mocked(Log.log).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: false, issues: ['issue1'], advice: 'advice' },
      check: new MockFailedCheck(),
      duration: 0,
    });
    expect(jest.mocked(Log.log).mock.calls[0][0]).toContain('advice');
  });
});
