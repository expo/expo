import { argvRequestsJson, isJsonRequested, setJsonRequested } from '../jsonMode';

describe(argvRequestsJson, () => {
  it('finds the flag anywhere in the arguments it owns', () => {
    expect(argvRequestsJson(['--json'])).toBe(true);
    expect(argvRequestsJson(['expo-sqlite', '--json'])).toBe(true);
    expect(argvRequestsJson(['--plan', '--json', '--ios'])).toBe(true);
  });

  it('is false when the flag is absent', () => {
    expect(argvRequestsJson([])).toBe(false);
    expect(argvRequestsJson(['--plan', '--ios'])).toBe(false);
  });

  // `install` and `start` forward everything after `--` to another tool, so a flag there is that
  // tool's and says nothing about what this CLI prints.
  it('ignores a flag that belongs to a forwarded tool', () => {
    expect(argvRequestsJson(['expo-sqlite', '--', '--json'])).toBe(false);
    expect(argvRequestsJson(['--json', '--', '--json'])).toBe(true);
  });
});

describe(isJsonRequested, () => {
  afterEach(() => setJsonRequested(false));

  it('answers what the launcher recorded', () => {
    expect(isJsonRequested()).toBe(false);
    setJsonRequested(true);
    expect(isJsonRequested()).toBe(true);
  });
});
