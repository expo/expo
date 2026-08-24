import { needsHumanError, needsHumanOf } from '../error';
import { findNeedsHumanScenario, needsHumanScenarios } from '../registry';

describe('needsHumanScenarios', () => {
  it('gives every scenario a unique id', () => {
    const ids = needsHumanScenarios.map((scenario) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every scenario a unique code', () => {
    const codes = needsHumanScenarios.map((scenario) => scenario.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it('spells every code SCREAMING_SNAKE_CASE', () => {
    for (const scenario of needsHumanScenarios) {
      expect(scenario.code).toMatch(/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/);
    }
  });

  it('spells every id kebab-case', () => {
    for (const scenario of needsHumanScenarios) {
      expect(scenario.id).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    }
  });

  // A handoff with nothing to hand over is the failure this whole convention exists to remove.
  it('names a command or a URL for every scenario that is not a generic fallback', () => {
    for (const scenario of needsHumanScenarios) {
      if (scenario.generic) {
        // Its command is the invocation that stopped, filled in by the classifier.
        expect(scenario.command).toBeNull();
        continue;
      }
      expect(scenario.command ?? scenario.url).not.toBeNull();
    }
  });

  it('writes one sentence of need for every scenario', () => {
    for (const scenario of needsHumanScenarios) {
      expect(scenario.need.length).toBeGreaterThan(10);
      expect(scenario.need.trim()).toBe(scenario.need);
    }
  });

  // Order is what makes the generic rows a fallback rather than a first answer.
  it('keeps the generic fallbacks last', () => {
    const firstGeneric = needsHumanScenarios.findIndex((scenario) => scenario.generic);
    expect(firstGeneric).toBeGreaterThan(-1);
    expect(needsHumanScenarios.slice(firstGeneric).every((scenario) => scenario.generic)).toBe(
      true
    );
  });

  it('never gives a signature to a scenario that names no tool', () => {
    for (const scenario of needsHumanScenarios) {
      if (!scenario.tools.length) {
        expect(scenario.signatures).toEqual([]);
      }
    }
  });

  it('holds the fourteen scenarios of the protocol', () => {
    expect(needsHumanScenarios.map((scenario) => scenario.id)).toEqual([
      'eas-login',
      'expo-login',
      'macos-automation',
      'asc-api-key-create',
      'apple-auth',
      'ios-credentials',
      'android-keystore',
      'device-register',
      'launch-browser-handoff',
      'eas-env-list',
      'eas-profile-selection',
      'agent-selection',
      'expo-prompt',
      'eas-prompt',
    ]);
  });
});

describe(findNeedsHumanScenario, () => {
  it('answers with null for a name nothing is registered under', () => {
    expect(findNeedsHumanScenario('nope')).toBeNull();
  });
});

describe(needsHumanError, () => {
  it('carries the row of the scenario, and exits 7', () => {
    const error = needsHumanError('eas-login', {
      message: 'Nobody is signed in.',
      detectedBy: 'preflight',
    });

    expect(error.code).toBe('EAS_LOGIN_REQUIRED');
    expect(error.exitCode).toBe(7);
    expect(error.isNeedsHuman).toBe(true);
    expect(error.suggestedCommand).toBe('npx eas login');
    expect(error.needsHuman).toEqual({
      scenario: 'eas-login',
      need: 'Sign in to an Expo account on this machine.',
      command: 'npx eas login',
      url: 'https://expo.dev/settings/access-tokens',
      unattendedEnv: ['EXPO_TOKEN'],
      resumable: true,
      detectedBy: 'preflight',
    });
  });

  // Reclassifying a shipped failure must not rename the code an agent may already branch on.
  it('keeps the code a site already ships', () => {
    const error = needsHumanError('expo-login', {
      message: 'Launch needs an Expo account.',
      detectedBy: 'exit-signature',
      code: 'LAUNCH_NOT_AUTHENTICATED',
    });

    expect(error.code).toBe('LAUNCH_NOT_AUTHENTICATED');
    expect(error.needsHuman.scenario).toBe('expo-login');
  });

  it('refuses an id that is not in the registry', () => {
    expect(() => needsHumanError('nope', { message: 'x', detectedBy: 'preflight' })).toThrow(
      /No needs-human scenario/
    );
  });
});

describe(needsHumanOf, () => {
  it('lets a site name the URL the row cannot know', () => {
    const scenario = findNeedsHumanScenario('launch-browser-handoff')!;

    expect(
      needsHumanOf(scenario, { detectedBy: 'preflight', url: 'https://launch.expo.dev/l/abc' })
    ).toMatchObject({ url: 'https://launch.expo.dev/l/abc', resumable: false });
  });
});
