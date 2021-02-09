import FirebaseAnalyticsJS from '../FirebaseAnalyticsJS';

let eventName = '';
const expectedErrorMessage = (name, eventName, maxLength) =>
  `Invalid ${name} (${eventName}) specified. Should contain 1 to ${maxLength} alphanumeric characters or underscores. The name must start with an alphabetic character.`;
const options = {
  clientId: '0',
  sessionId: '0',
};

it(`Verfies parseEvent eventName validation`, async () => {
  const name = 'event-name';
  expect.assertions(3);
  FirebaseAnalyticsJS.parseEvent(options, 'MyAnalyticsEvent');

  try {
    eventName = '_MyAnalyticsEvent';
    FirebaseAnalyticsJS.parseEvent(options, eventName);
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage(name, eventName, 40));
  }

  try {
    eventName = '0MyAnalyticsEvent';
    FirebaseAnalyticsJS.parseEvent(options, eventName);
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage(name, eventName, 40));
  }

  FirebaseAnalyticsJS.parseEvent(options, 'MyAnalyticsEvent0');

  try {
    eventName = '0SuperLongNameThatIsMoreThan40CharactersInLength';
    FirebaseAnalyticsJS.parseEvent(options, eventName);
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage(name, eventName, 40));
  }

  FirebaseAnalyticsJS.parseEvent(options, 'user_id');
});

it(`Verfies parseUserProperty userPropertyName validation`, async () => {
  const name = 'user-property name';
  expect.assertions(4);
  const value = 'value';

  FirebaseAnalyticsJS.parseUserProperty(options, 'MyAnalyticsEvent', value);

  try {
    eventName = '_MyAnalyticsEvent';
    FirebaseAnalyticsJS.parseUserProperty(options, eventName, value);
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage(name, eventName, 24));
  }

  try {
    eventName = '0MyAnalyticsEvent';
    FirebaseAnalyticsJS.parseUserProperty(options, eventName, value);
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage(name, eventName, 24));
  }

  FirebaseAnalyticsJS.parseUserProperty(options, 'MyAnalyticsEvent0', value);

  try {
    eventName = '0LongNameThatIsMoreThan24ButLessThan40';
    FirebaseAnalyticsJS.parseUserProperty(options, eventName, value);
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage(name, eventName, 24));
  }

  try {
    eventName = 'user_id';
    FirebaseAnalyticsJS.parseUserProperty(options, eventName, value);
  } catch (error) {
    expect(error.message).toBe(expectedErrorMessage(name, eventName, 24));
  }
});
