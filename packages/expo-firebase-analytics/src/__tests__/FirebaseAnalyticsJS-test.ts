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

it(`Verfies parseEvent eventParams`, async () => {
  expect(
    FirebaseAnalyticsJS.parseEvent(options, 'MyAnalyticsEvent', {
      foo: 'bar', // string
      num: 10, // number
      extraordinary: true, // boolean
      items: [
        // items array
        {
          id: '123456',
          name: 'nome',
          location_id: 'tv',
          quantity: 2,
          brand: 'onfire',
          variant: 'loki',
          list: 'marvel',
          category: 'awesome',
          foo1: 'bar1',
          foo2: 'bar2',
        },
        {
          id: '98765',
        },
      ],
    })
  ).toMatchObject({
    en: 'MyAnalyticsEvent',
    'ep.foo': 'bar',
    'epn.num': 10,
    'ep.extraordinary': true,
    pr1: 'id123456~nmnome~lotv~qt2~bronfire~valoki~lnmarvel~caawesome~k0foo1~v0bar1~k1foo2~v1bar2',
    pr2: 'id98765',
  });
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
