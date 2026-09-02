import { EXPO_GO_APP_IDS, decideExpoGoTarget } from '../target';

function input(overrides: Partial<Parameters<typeof decideExpoGoTarget>[0]> = {}) {
  return {
    targetAppIds: [],
    hasNativeDirs: false,
    usesDevClient: false,
    ...overrides,
  };
}

describe(decideExpoGoTarget, () => {
  it(`should know both Expo Go application ids`, () => {
    expect(EXPO_GO_APP_IDS).toEqual(['host.exp.Exponent', 'host.exp.exponent']);
  });

  it(`should trust an Expo Go app id passed on the command line`, () => {
    const decision = decideExpoGoTarget(input({ appIdOverride: 'host.exp.Exponent' }));

    expect(decision.isExpoGo).toBe(true);
    expect(decision.reason).toContain('--app-id');
  });

  it(`should trust a development build app id passed on the command line`, () => {
    const decision = decideExpoGoTarget(
      input({ appIdOverride: 'com.example.demo', targetAppIds: ['host.exp.Exponent'] })
    );

    expect(decision.isExpoGo).toBe(false);
    expect(decision.reason).toContain('--app-id');
  });

  it(`should read Expo Go from the app connected to the dev server`, () => {
    const decision = decideExpoGoTarget(input({ targetAppIds: ['host.exp.exponent'] }));

    expect(decision.isExpoGo).toBe(true);
    expect(decision.reason).toContain('dev server');
  });

  it(`should read a development build from the app connected to the dev server`, () => {
    const decision = decideExpoGoTarget(
      input({ targetAppIds: ['com.example.demo'], hasNativeDirs: false })
    );

    expect(decision.isExpoGo).toBe(false);
    expect(decision.reason).toContain('com.example.demo');
  });

  it(`should assume Expo Go for a managed project with no app connected`, () => {
    const decision = decideExpoGoTarget(input());

    expect(decision.isExpoGo).toBe(true);
    expect(decision.reason).toMatch(/no app is connected|expo-dev-client/i);
  });

  it(`should not assume Expo Go when the project has native directories`, () => {
    expect(decideExpoGoTarget(input({ hasNativeDirs: true })).isExpoGo).toBe(false);
  });

  it(`should not assume Expo Go when the project uses expo-dev-client`, () => {
    expect(decideExpoGoTarget(input({ usesDevClient: true })).isExpoGo).toBe(false);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server
//
// `certain` decides whether a connect URL may be printed as one line. `exp://<host>` is the Expo Go
// form and `<scheme>://expo-development-client/?url=…` is the development build's; they are not
// interchangeable, so a branch that guesses prints both.
describe(`${decideExpoGoTarget.name} — how sure it is`, () => {
  const nothingConnected = { targetAppIds: [], hasNativeDirs: false, usesDevClient: false };

  it.each([
    ['--app-id naming Expo Go', { ...nothingConnected, appIdOverride: 'host.exp.Exponent' }],
    [
      '--app-id naming a development build',
      { ...nothingConnected, appIdOverride: 'com.example.app' },
    ],
    [
      'an app connected to the dev server',
      { ...nothingConnected, targetAppIds: ['com.example.app'] },
    ],
    ['the expo-dev-client dependency', { ...nothingConnected, usesDevClient: true }],
    ['a project with no dev-build machinery at all', nothingConnected],
  ])(`is certain from %s`, (_name, input) => {
    expect(decideExpoGoTarget(input).certain).toBe(true);
  });

  // The one branch that guesses: a bare project has a build of its own and may still be opened in
  // Expo Go, and nothing here can tell which happened.
  it(`is uncertain from a checked-in native directory alone`, () => {
    const decision = decideExpoGoTarget({ ...nothingConnected, hasNativeDirs: true });

    expect(decision.certain).toBe(false);
    expect(decision.isExpoGo).toBe(false);
    expect(decision.reason).toContain('does not rule Expo Go out');
  });

  // The dependency outranks the directory, and it settles the question.
  it(`is certain when the project both has native directories and depends on the dev client`, () => {
    expect(
      decideExpoGoTarget({ ...nothingConnected, hasNativeDirs: true, usesDevClient: true }).certain
    ).toBe(true);
  });
});
