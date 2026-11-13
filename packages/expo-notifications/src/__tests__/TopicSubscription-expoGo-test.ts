import { UnavailabilityError } from 'expo';

let mockIsRunningInExpoGo = true;

// Expo Go on Android does not register `ExpoTopicSubscriptionModule`. The `src` jest preset
// resolves the iOS shim, so the Android module is wired in explicitly.
jest.mock('expo', () => {
  const expo = jest.requireActual('expo');
  return {
    ...expo,
    requireNativeModule: (name: string) => {
      throw new Error(`Cannot find native module '${name}'`);
    },
    requireOptionalNativeModule: () => null,
    isRunningInExpoGo: () => mockIsRunningInExpoGo,
    Platform: { ...expo.Platform, OS: 'android' },
  };
});
jest.mock('../TopicSubscriptionModule', () =>
  jest.requireActual('../TopicSubscriptionModule.android')
);

const TOPIC_FUNCTIONS = ['subscribeToTopicAsync', 'unsubscribeFromTopicAsync'];

beforeEach(() => {
  mockIsRunningInExpoGo = true;
});

it('does not throw on import when the native module is missing', () => {
  expect(() => require('../TopicSubscriptionModule.android')).not.toThrow();
  expect(() => require('../topicSubscription')).not.toThrow();
});

it.each(TOPIC_FUNCTIONS)(
  '%s rejects with the Expo Go error in Expo Go on Android',
  async (name) => {
    const topicSubscription = require('../topicSubscription');
    await expect(topicSubscription[name]('topic')).rejects.toThrow(/Expo Go/);
  }
);

it.each(TOPIC_FUNCTIONS)(
  '%s rejects with UnavailabilityError outside Expo Go when the native module is missing',
  async (name) => {
    mockIsRunningInExpoGo = false;
    const topicSubscription = require('../topicSubscription');
    await expect(topicSubscription[name]('topic')).rejects.toBeInstanceOf(UnavailabilityError);
  }
);
