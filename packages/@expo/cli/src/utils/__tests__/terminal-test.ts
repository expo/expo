import { getUserTerminal } from '../terminal';

const platform = process.platform;

const mockPlatform = (value: typeof process.platform) =>
  Object.defineProperty(process, 'platform', {
    value,
  });

afterEach(() => {
  mockPlatform(platform);
});

describe(getUserTerminal, () => {
  // We go hard on testing environment variables because they're global, untyped, unversioned territory.
  const originalValues = {
    REACT_TERMINAL: process.env.REACT_TERMINAL,
    TERM_PROGRAM: process.env.TERM_PROGRAM,
    TERM: process.env.TERM,
  };
  afterEach(() => {
    Object.keys(originalValues).forEach((key) => {
      process.env[key] = originalValues[key];
    });
  });
  beforeEach(() => {
    mockPlatform('darwin');
    Object.keys(originalValues).forEach((key) => {
      delete process.env[key];
    });
  });
  it('defaults to $TERM on non-darwin', () => {
    mockPlatform('win32');
    process.env.TERM_PROGRAM = 'TERM_PROGRAM';
    process.env.TERM = 'TERM';
    expect(getUserTerminal()).toEqual('TERM');
  });
  it('defaults to $TERM_PROGRAM on darwin', () => {
    mockPlatform('darwin');
    process.env.TERM_PROGRAM = 'TERM_PROGRAM';
    process.env.TERM = 'TERM';
    expect(getUserTerminal()).toEqual('TERM_PROGRAM');
  });
  it('uses $REACT_TERMINAL if defined', () => {
    process.env.REACT_TERMINAL = 'REACT_TERMINAL';
    process.env.TERM_PROGRAM = 'TERM_PROGRAM';
    process.env.TERM = 'TERM';
    for (const platform of ['darwin', 'win32'] as const) {
      mockPlatform(platform);
      expect(getUserTerminal()).toEqual('REACT_TERMINAL');
    }
  });
  it('returns undefined when no terminals are defined', () => {
    for (const platform of ['darwin', 'win32'] as const) {
      mockPlatform(platform);
      expect(getUserTerminal()).toEqual(undefined);
    }
  });
});
