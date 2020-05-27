import FirebaseAnalyticsJS from '../FirebaseAnalyticsJS';

it(`Verfies parseEvent eventName validation`, async () => {
  expect.assertions(2);
  const expectedErrorMessage =
    'Invalid event-name specified. Should contain 1 to 40 alphanumeric characters or underscores. The name must start with an alphabetic character.';
  const options = {
    clientId: '0',
    sessionId: '0',
  };

  FirebaseAnalyticsJS.parseEvent(options, 'MyAnalyticsEvent');

  try {
    FirebaseAnalyticsJS.parseEvent(options, '_MyAnalyticsEvent');
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage);
  }

  try {
    FirebaseAnalyticsJS.parseEvent(options, '0MyAnalyticsEvent');
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage);
  }

  FirebaseAnalyticsJS.parseEvent(options, 'MyAnalyticsEvent0');
});
