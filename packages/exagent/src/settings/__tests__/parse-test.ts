/* eslint-env jest */
// @ref llp/0015-backend-selection-and-config.rfc.md §Validation
// Every value the config takes, and every value it refuses. Pure: no file, no project.
import { parseExagentSettings, settingsAreEmpty, settingsBuildBackend } from '../parse';
import { EMPTY_SETTINGS } from '../types';

const WHERE = '"expo.exagent" in package.json';

function parse(raw: unknown) {
  return parseExagentSettings(raw, WHERE);
}

describe('an absent config', () => {
  it(`reads as nothing configured`, () => {
    expect(parse(undefined)).toEqual(EMPTY_SETTINGS);
    expect(parse(null)).toEqual(EMPTY_SETTINGS);
    expect(settingsAreEmpty(parse(undefined))).toBe(true);
  });

  it(`reads an empty object as nothing configured too`, () => {
    expect(parse({})).toEqual(EMPTY_SETTINGS);
    expect(settingsAreEmpty(parse({}))).toBe(true);
  });
});

describe('the values the config takes', () => {
  it.each(['expo-go', 'dev-build'])(`accepts target: %s`, (target) => {
    expect(parse({ target }).target).toBe(target);
  });

  it.each(['local', 'eas'])(`accepts buildBackend: %s`, (buildBackend) => {
    expect(parse({ buildBackend }).buildBackend).toBe(buildBackend);
  });

  it(`accepts a per-platform buildBackend`, () => {
    const settings = parse({ buildBackend: 'local', ios: { buildBackend: 'eas' } });
    expect(settings.ios).toEqual({ buildBackend: 'eas' });
    expect(settings.android).toBeNull();
  });

  it(`is not empty once anything is set`, () => {
    expect(settingsAreEmpty(parse({ android: { buildBackend: 'eas' } }))).toBe(false);
  });
});

describe('resolving the backend for one platform', () => {
  it(`prefers the platform's own answer over the shared one`, () => {
    const settings = parse({ buildBackend: 'local', ios: { buildBackend: 'eas' } });
    expect(settingsBuildBackend(settings, 'ios')).toBe('eas');
    expect(settingsBuildBackend(settings, 'android')).toBe('local');
  });

  it(`falls back to the shared answer, then to nothing`, () => {
    expect(settingsBuildBackend(parse({ buildBackend: 'eas' }), 'android')).toBe('eas');
    expect(settingsBuildBackend(parse({}), 'ios')).toBeNull();
  });

  it(`treats a platform entry that names no backend as saying nothing`, () => {
    expect(settingsBuildBackend(parse({ buildBackend: 'eas', ios: {} }), 'ios')).toBe('eas');
  });
});

describe('what the config refuses', () => {
  it(`refuses a value that is not an object, and names the location`, () => {
    expect(() => parse('eas')).toThrow(/"expo.exagent" in package.json is "eas"/);
    expect(() => parse(['eas'])).toThrow(/is an array, and it has to be an object/);
  });

  it(`refuses an unknown key rather than ignoring it`, () => {
    expect(() => parse({ backend: 'eas' })).toThrow(/does not know: "backend"/);
    // The reason is the whole point of refusing: a dropped preference is an unasked-for plan.
    expect(() => parse({ backend: 'eas' })).toThrow(/silently dropped/);
  });

  it(`names the key a typo looks like`, () => {
    expect(() => parse({ buildbackend: 'eas' })).toThrow(
      /"buildbackend" looks like "buildBackend"/
    );
    expect(() => parse({ 'build-backend': 'eas' })).toThrow(
      /"build-backend" looks like "buildBackend"/
    );
  });

  it(`lists the keys this version takes`, () => {
    expect(() => parse({ nope: 1 })).toThrow(/"target", "buildBackend", "ios", "android"/);
  });

  it(`refuses a value outside the set, and lists the set`, () => {
    expect(() => parse({ buildBackend: 'cloud' })).toThrow(
      /buildBackend is "cloud", and the only values it takes are "local", "eas"/
    );
    expect(() => parse({ target: 'devbuild' })).toThrow(/"expo-go", "dev-build"/);
    expect(() => parse({ buildBackend: 1 })).toThrow(/is 1 \(a number\)/);
  });

  it(`refuses a platform entry that is not an object`, () => {
    expect(() => parse({ ios: 'eas' })).toThrow(/› ios is "eas", and it has to be an object/);
  });

  it(`refuses an unknown key inside a platform entry`, () => {
    expect(() => parse({ ios: { target: 'dev-build' } })).toThrow(
      /› ios names a key this version of exagent does not know: "target"/
    );
  });

  it(`carries the BAD_EXAGENT_CONFIG code and no suggested command`, () => {
    expect.assertions(2);
    try {
      parse({ buildBackend: 'cloud' });
    } catch (error: any) {
      expect(error.code).toBe('BAD_EXAGENT_CONFIG');
      // The fix is an edit; every command that reads the config stops in the same place until it
      // is made, so there is no command to suggest.
      expect(error.suggestedCommand).toBeUndefined();
    }
  });

  it(`says what, why and how`, () => {
    expect.assertions(3);
    try {
      parse({ buildBackend: 'cloud' });
    } catch (error: any) {
      const [what, why, how] = String(error.message).split('\n');
      expect(what).toContain('"expo.exagent" in package.json');
      expect(why).toMatch(/^Why: /);
      expect(how).toMatch(/^How: /);
    }
  });
});
