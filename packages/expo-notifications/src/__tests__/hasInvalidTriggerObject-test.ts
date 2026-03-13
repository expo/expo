import { hasValidTriggerObject } from '../hasValidTriggerObject';

describe(hasValidTriggerObject, () => {
  it('returns true for null', () => {
    expect(hasValidTriggerObject(null)).toBe(true);
  });

  it('returns true when type / channelId key is present (regardless of value) - an approximation', () => {
    expect(hasValidTriggerObject({ type: 'whatever' })).toBe(true);
    expect(hasValidTriggerObject({ channelId: 'whatever' })).toBe(true);
  });

  it('returns false for a plain object without type/channelId', () => {
    expect(hasValidTriggerObject({})).toBe(false);
    expect(hasValidTriggerObject({ foo: 'bar' })).toBe(false);
  });
});
