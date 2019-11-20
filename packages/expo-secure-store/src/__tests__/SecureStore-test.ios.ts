import * as SecureStore from '../SecureStore';

it(`exports accessibility options`, () => {
  expect(SecureStore.AFTER_FIRST_UNLOCK).toMatchSnapshot('AFTER_FIRST_UNLOCK');
  expect(SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY).toMatchSnapshot(
    'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY'
  );
  expect(SecureStore.ALWAYS).toMatchSnapshot('ALWAYS');
  expect(SecureStore.ALWAYS_THIS_DEVICE_ONLY).toMatchSnapshot('ALWAYS_THIS_DEVICE_ONLY');
  expect(SecureStore.WHEN_UNLOCKED).toMatchSnapshot('WHEN_UNLOCKED');
  expect(SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY).toMatchSnapshot(
    'WHEN_UNLOCKED_THIS_DEVICE_ONLY'
  );
  expect(SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY).toMatchSnapshot(
    'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY'
  );
});
