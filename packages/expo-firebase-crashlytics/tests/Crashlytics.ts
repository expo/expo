export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  OS,
  device,
}) {
  describe('crashlytics()', () => {
    // todo test is flakey due to a detox error occurring sometimes;
    // Error: the string "Error when sending event: websocketFailed with body:
    // {\n    id = 0;\n    message = \"The operation couldn\\U2019t be completed.
    // Connection refused\";\n}. Bridge is not set. This is probably because you've
    // explicitly synthesized the bridge in RCTWebSocketModule, even though it's
    // inherited from RCTEventEmitter.
    xdescribe('crash()', () => {
      it('should force an app crash', async () => {
        await firebase.crashlytics().crash();
        if (OS === 'ios') {
          // ios responds quicker after a fatal exception if we re-install
          await device.uninstallApp();
          await device.installApp();
        }

        await device.launchApp({ newInstance: true });
        await firebase.crashlytics().log('app relaunched from a crash');
      });
    });

    describe('log()', () => {
      it('should set a string value', async () => {
        await firebase.crashlytics().log('123abc');
      });

      xit('should error on a non a string value', async () => {
        // TODO lib needs validations adding
        await firebase.crashlytics().log(123456);
      });
    });

    describe('recordError()', () => {
      it('should record an error with a code and message', async () => {
        await firebase.crashlytics().recordError(1234, 'Test error');
      });

      xit('should error on invalid args', async () => {
        // TODO lib needs validations adding - and this should technically take an instance of Error only
        await firebase.crashlytics().recordError({}, []);
      });
    });

    describe('setBoolValue()', () => {
      it('should set a boolean value', async () => {
        await firebase.crashlytics().setBoolValue('boolKey', true);
      });
    });

    describe('setFloatValue()', () => {
      it('should set a float value', async () => {
        await firebase.crashlytics().setFloatValue('floatKey', 1.23);
      });
    });

    describe('setIntValue()', () => {
      it('should set a integer value', async () => {
        await firebase.crashlytics().setIntValue('intKey', 123);
      });
    });

    describe('setStringValue()', () => {
      it('should set a string value', async () => {
        await firebase.crashlytics().setStringValue('stringKey', 'test');
      });
    });

    describe('setUserIdentifier()', () => {
      it('should set a string value', async () => {
        await firebase.crashlytics().setUserIdentifier('123abc');
      });

      xit('should error on a non a string value', async () => {
        // TODO lib needs validations adding
        await firebase.crashlytics().setUserIdentifier(123456);
      });
    });
  });
}
