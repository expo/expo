import { asMock } from '../__tests__/asMock';
import { DoctorCheck } from '../checks/checks.types';
import {
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
    asMock(Log.log).mockReset();
    printCheckResultSummaryOnComplete({
      result: { isSuccessful: true, issues: [], advice: '' },
      check: new MockSuccessfulCheck(),
      duration: 0,
    });
    expect(asMock(Log.log)).toHaveBeenCalledWith(expect.stringMatching('✔ Mock successful check'));
  });

  it(`Prints test description with x if test is not successful`, () => {
    asMock(Log.log).mockReset();
    printCheckResultSummaryOnComplete({
      result: { isSuccessful: false, issues: [], advice: '' },
      check: new MockFailedCheck(),
      duration: 0,
    });
    expect(asMock(Log.log)).toHaveBeenCalledWith(expect.stringContaining('✖ Mock failed check'));
  });

  it(`Prints error if check throws an unexpected error`, () => {
    asMock(Log.error).mockReset();
    asMock(Log.exception).mockReset();
    printCheckResultSummaryOnComplete({
      result: { isSuccessful: false, issues: [], advice: '' },
      check: new MockFailedCheck(),
      duration: 0,
      error: new Error('Some error'),
    });
    expect(asMock(Log.error).mock.calls[0][0]).toContain('Unexpected error while running');
    expect(asMock(Log.exception).mock.calls[0][0].message).toContain('Some error');
  });
});

describe(printFailedCheckIssueAndAdvice, () => {
  it(`Does not print when check is successful`, () => {
    asMock(Log.log).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: true, issues: [], advice: '' },
      check: new MockSuccessfulCheck(),
      duration: 0,
    });
    expect(asMock(Log.log)).not.toHaveBeenCalled();
  });

  // these errors print in-line so they're easier to associate with the origianl check
  it(`Does not print when check throws an error`, () => {
    asMock(Log.log).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: false, issues: [], advice: '' },
      check: new MockUnexpectedThrowCheck(),
      error: new Error('Some error'),
      duration: 0,
    });
    expect(asMock(Log.log)).not.toHaveBeenCalled();
  });

  it(`Prints issues when check fails`, () => {
    asMock(Log.warn).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: false, issues: ['issue1', 'issue2'], advice: '' },
      check: new MockFailedCheck(),
      duration: 0,
    });
    expect(asMock(Log.warn).mock.calls[0][0]).toContain('issue1');
    expect(asMock(Log.warn).mock.calls[1][0]).toContain('issue2');
  });
  it(`Prints advice when check fails if available`, () => {
    asMock(Log.log).mockReset();
    printFailedCheckIssueAndAdvice({
      result: { isSuccessful: false, issues: ['issue1'], advice: 'advice' },
      check: new MockFailedCheck(),
      duration: 0,
    });
    expect(asMock(Log.log).mock.calls[0][0]).toContain('advice');
  });
});
