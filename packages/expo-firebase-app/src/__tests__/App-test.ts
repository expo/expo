import firebase from 'expo-firebase-app';

/* To silence github bots */
import config from '../../secret-config';

function rand(from = 1, to = 9999) {
  const r = Math.random();
  return Math.floor(r * (to - from + from));
}

describe(`Firebase`, () => {
  xit(`should create js apps for natively initialized apps`, async () => {
    // N/A in Expo
    expect(firebase.app()._nativeInitialized).toBe(true);
  });

  it(`should have options available in js for natively initialized apps`, async () => {
    expect(firebase.app().options.apiKey).toBe(config.apiKey);
    expect(firebase.app().options.appId).toBe(config.appId);
    expect(firebase.app().options.databaseURL).toBe(config.databaseURL);
    expect(firebase.app().options.messagingSenderId).toBe(config.messagingSenderId);
    expect(firebase.app().options.projectId).toBe(config.projectId);
    expect(firebase.app().options.storageBucket).toBe(config.storageBucket);
  });

  it(`should resolve onReady for natively initialized apps`, () => firebase.app().onReady());

  it(`should initialize dynamic apps`, async () => {
    const name = `testscoreapp${rand()}`;
    return firebase
      .initializeApp(config, name)
      .onReady()
      .then(newApp => {
        expect(newApp.name).toBe(name.toUpperCase());
        expect(newApp.toString()).toBe(name.toUpperCase());
        expect(newApp.options.apiKey).toBe(config.apiKey);
        // TODO add back in when android sdk support for deleting apps becomes available
        // return newApp.delete();
      });
  });

  it(`should return a string version`, () => {
    expect(typeof firebase.SDK_VERSION).toBe(`string`);
  });
});

describe(`App`, () => {
  it(`should provide an array of apps`, async () => {
    expect(!!firebase.apps.length).toBe(true);
    expect(firebase.apps.includes(firebase.app(`[DEFAULT]`))).toBe(true);
  });

  xit(`delete default app is unsupported`, () => {
    expect(firebase.app().delete()).toThrow(
      `Unable to delete the default native firebase app instance.`
    );
  });

  it(`should reject if an object is not extended correctly`, () => {
    expect(firebase.app().extendApp(`string`)).toThrow(
      'Missing required argument of type `Object` for method `extendApp()`.'
    );
  });

  it(`should reject if a protected property is extended`, () => {
    expect(
      firebase.app().extendApp({
        database: {},
      })
    ).toThrow('Property `database` is protected and can not be overridden by extendApp.');
  });

  it(`should provide additional functionality with extendApp`, () => {
    const extension = {};
    firebase.app().extendApp({
      extension,
    });
    expect((firebase.app() as any).extension).toBe(extension);
  });
});
