import { EXPO_GO_APP_IDS, decideExpoGoTarget } from '../target';

function input(overrides: Partial<Parameters<typeof decideExpoGoTarget>[0]> = {}) {
  return {
    targetAppIds: [],
    hasNativeDirs: false,
    usesDevClient: false,
    // Unknown by default, which is what a caller that could not read the project answers — and is
    // the behaviour every case written before this input existed was written against.
    expoGoCompatible: null,
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

// @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
//
// Expo Go ships a fixed native runtime, so a project with a native module that runtime does not
// contain cannot run there at all. This function used to decide from four facts, none of which was
// that one, and its last branch answered `isExpoGo: true` with `certain: true` for exactly that
// project — while `status` and the plan engine, reading `state.expoGo.compatible`, already said
// `needs-dev-client`. One question with two answers.
//
// Live: a CNG project with a podspec-shipping dependency got `exp://…` from `smoke`, Expo Go
// answered the debugger, and the gate reported `passed` at exit 0 — a run that proved Expo Go can
// boot the bundle and called it the app working [observed — iOS 26.5 simulator, 2026-09-03].
describe(`${decideExpoGoTarget.name} — a project that does not fit in Expo Go`, () => {
  it(`does not default to Expo Go for an incompatible project`, () => {
    const decision = decideExpoGoTarget(input({ expoGoCompatible: false }));

    expect(decision.isExpoGo).toBe(false);
    expect(decision.certain).toBe(true);
    expect(decision.reason).toContain('cannot run in Expo Go');
  });

  // The compatible project is the case that must not change: this is the ordinary Expo Go run.
  it(`still defaults to Expo Go for a compatible project`, () => {
    expect(decideExpoGoTarget(input({ expoGoCompatible: true })).isExpoGo).toBe(true);
  });

  // Unknown is not "no". A caller that could not read the project must get the behaviour that was
  // here before this input existed, or a probe failure would start refusing working runs.
  it(`falls back to the old default when compatibility is unknown`, () => {
    expect(decideExpoGoTarget(input({ expoGoCompatible: null })).isExpoGo).toBe(true);
  });

  // It sits above the native-directory guess, so a project ruled out for a reason that directory
  // could not show — an unbundled native module — is settled rather than guessed at.
  it(`settles a bare project that is also ruled out on its modules`, () => {
    const decision = decideExpoGoTarget(input({ hasNativeDirs: true, expoGoCompatible: false }));

    expect(decision.isExpoGo).toBe(false);
    expect(decision.certain).toBe(true);
  });

  // And the uncertainty survives where it belongs. A checked-in native directory on its own is not
  // a reason that rules Expo Go out (@ref src/project/expoGo §RULES_OUT_EXPO_GO), so such a project
  // reaches this function as `null` and keeps the branch that prints both connect URLs.
  it(`leaves a bare project uncertain when nothing rules Expo Go out`, () => {
    const decision = decideExpoGoTarget(input({ hasNativeDirs: true, expoGoCompatible: null }));

    expect(decision.certain).toBe(false);
    expect(decision.reason).toContain('does not rule Expo Go out');
  });

  // And it does **not** outrank an observation. `--app-id` is the caller saying they know better,
  // and an app on the dev server is the app that will open the link whatever the project says —
  // reporting `<scheme>://` for a session that is demonstrably Expo Go would send the link to an
  // app that is not there. What such a run must not do is call itself a pass, which is the smoke
  // gate's question rather than this function's.
  it.each([
    ['--app-id names Expo Go', { appIdOverride: 'host.exp.Exponent' }],
    ['Expo Go is the app on the dev server', { targetAppIds: ['host.exp.Exponent'] }],
  ])(`still reports Expo Go when %s`, (_name, overrides) => {
    expect(decideExpoGoTarget(input({ ...overrides, expoGoCompatible: false })).isExpoGo).toBe(
      true
    );
  });
});
