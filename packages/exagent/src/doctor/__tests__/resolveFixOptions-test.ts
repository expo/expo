/* eslint-env jest */
// @ref llp/0013-doctor-fix.rfc.md §Command spec
import { resolvePlatforms, resolveTier } from '../resolveFixOptions';

describe('resolveTier', () => {
  it('defaults to safe', () => {
    expect(resolveTier(undefined)).toBe('safe');
    expect(resolveTier(null)).toBe('safe');
  });

  it.each(['safe', 'moderate', 'aggressive'])('reads %s', (tier) => {
    expect(resolveTier(tier)).toBe(tier);
  });

  // A typo that fell back to the default would run a safe reset and report success, which reads as
  // "the moderate tier found nothing" to the caller who asked for it.
  it('refuses a tier it does not know, and names the ones it does', () => {
    expect(() => resolveTier('moderatte')).toThrow(/safe, moderate, aggressive/);
    expect(() => resolveTier('MODERATE')).toThrow(/BAD_ARGS|safe, moderate/);
  });
});

describe('resolvePlatforms', () => {
  // Null is not the same answer as both: it means "read them off the project", and a CNG project
  // and a bare android-only project give different answers to that.
  it('answers null when the caller named none', () => {
    expect(resolvePlatforms(undefined)).toBeNull();
  });

  it('reads ios, android and all', () => {
    expect(resolvePlatforms('ios')).toEqual(['ios']);
    expect(resolvePlatforms('android')).toEqual(['android']);
    expect(resolvePlatforms('all')).toEqual(['ios', 'android']);
  });

  it('refuses a platform it does not reset', () => {
    expect(() => resolvePlatforms('tvos')).toThrow(/ios, android or all/);
    expect(() => resolvePlatforms('web')).toThrow(/ios, android or all/);
  });
});
