import * as Hinge from '../index';

// jest-expo mocks the native module, so null it out to exercise the unavailable path.
jest.mock('../ExpoHinge', () => ({ __esModule: true, default: null }));

describe('expo-hinge on unsupported platforms', () => {
  test('reports unavailability', () => {
    expect(Hinge.isAvailable()).toBe(false);
  });

  test('returns no hinge', () => {
    expect(Hinge.getHinge()).toBeNull();
  });

  test('returns an inert subscription from addHingeListener', () => {
    const subscription = Hinge.addHingeListener(() => {});
    expect(typeof subscription.remove).toBe('function');
    subscription.remove();
  });
});
