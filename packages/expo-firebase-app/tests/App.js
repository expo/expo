const androidTestConfig = {
  // firebase android sdk completely ignores client id
  clientId: '305229645282-j8ij0jev9ut24odmlk9i215pas808ugn.apps.googleusercontent.com',
  appId: '1:305229645282:android:af36d4d29a83e04c',
  apiKey: 'AIzaSyCzbBYFyX8d6VdSu7T4s10IWYbPc-dguwM',
  databaseURL: 'https://rnfirebase-b9ad4.firebaseio.com',
  storageBucket: 'rnfirebase-b9ad4.appspot.com',
  messagingSenderId: '305229645282',
  projectId: 'rnfirebase-b9ad4',
};

const iosTestConfig = {
  clientId: '305229645282-22imndi01abc2p6esgtu1i1m9mqrd0ib.apps.googleusercontent.com',
  androidClientId: androidTestConfig.clientId,
  appId: '1:305229645282:ios:af36d4d29a83e04c',
  apiKey: 'AIzaSyAcdVLG5dRzA1ck_fa_xd4Z0cY7cga7S5A',
  databaseURL: 'https://rnfirebase-b9ad4.firebaseio.com',
  storageBucket: 'rnfirebase-b9ad4.appspot.com',
  messagingSenderId: '305229645282',
  projectId: 'rnfirebase-b9ad4',
};

function rand(from = 1, to = 9999) {
  const r = Math.random();
  return Math.floor(r * (to - from + from));
}

export default function test({
  should,
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  OS,
  firebase,
}) {
  describe('Core', () => {
    describe('Firebase', () => {
      xit('it should create js apps for natively initialized apps', () => {
        // N/A in Expo
        should.equal(firebase.app()._nativeInitialized, true);
        return Promise.resolve();
      });

      it('natively initialized apps should have options available in js', () => {
        should.equal(
          firebase.app().options.apiKey,
          OS === 'ios' ? iosTestConfig.apiKey : androidTestConfig.apiKey
        );
        should.equal(
          firebase.app().options.appId,
          OS === 'ios' ? iosTestConfig.appId : androidTestConfig.appId
        );
        should.equal(firebase.app().options.databaseURL, iosTestConfig.databaseURL);
        should.equal(firebase.app().options.messagingSenderId, iosTestConfig.messagingSenderId);
        should.equal(firebase.app().options.projectId, iosTestConfig.projectId);
        should.equal(firebase.app().options.storageBucket, iosTestConfig.storageBucket);
        return Promise.resolve();
      });

      it('it should resolve onReady for natively initialized apps', () => firebase.app().onReady());

      it('it should initialize dynamic apps', () => {
        const name = `testscoreapp${rand()}`;
        return firebase
          .initializeApp(OS === 'ios' ? iosTestConfig : androidTestConfig, name)
          .onReady()
          .then(newApp => {
            newApp.name.should.equal(name.toUpperCase());
            newApp.toString().should.equal(name.toUpperCase());
            newApp.options.apiKey.should.equal(
              (OS === 'ios' ? iosTestConfig : androidTestConfig).apiKey
            );
            // TODO add back in when android sdk support for deleting apps becomes available
            // return newApp.delete();
            return Promise.resolve();
          });
      });

      it('SDK_VERSION should return a string version', () => {
        firebase.SDK_VERSION.should.be.a.String();
      });
    });

    describe('App', () => {
      it('apps should provide an array of apps', () => {
        should.equal(!!firebase.apps.length, true);
        should.equal(firebase.apps.includes(firebase.app('[DEFAULT]')), true);
        return Promise.resolve();
      });

      xit('delete default app is unsupported', () => {
        (() => {
          firebase.app().delete();
        }).should.throw('Unable to delete the default native firebase app instance.');
      });

      it('extendApp should error if an object is not supplied', () => {
        (() => {
          firebase.app().extendApp('string');
        }).should.throw("Missing required argument of type 'Object' for method 'extendApp()'.");
      });

      it('extendApp should error if a protected property is supplied', () => {
        (() => {
          firebase.app().extendApp({
            database: {},
          });
        }).should.throw("Property 'database' is protected and can not be overridden by extendApp.");
      });

      it('extendApp should provide additional functionality', () => {
        const extension = {};
        firebase.app().extendApp({
          extension,
        });
        firebase.app().extension.should.equal(extension);
      });
    });
  });
}
