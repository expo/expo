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
