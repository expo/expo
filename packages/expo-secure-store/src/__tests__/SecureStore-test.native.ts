import ExpoSecureStore from '../ExpoSecureStore';
import * as SecureStore from '../SecureStore';

it(`sets values`, async () => {
  const testKey = 'key-test_0.0';
  const testValue = 'value `~!@#$%^&*();:\'"-_.,<>';
  const options = { keychainService: 'test' };
  await SecureStore.setItemAsync(testKey, testValue, options);

  expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenCalledTimes(1);
  expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenCalledWith(testValue, testKey, options);
});

it(`provides default options when setting values`, async () => {
  await SecureStore.setItemAsync('key', 'value');
  expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenCalledWith('value', 'key', {});
});

it(`gets values`, async () => {
  ExpoSecureStore.getValueWithKeyAsync.mockImplementation(async () => 'value');

  const options = { keychainService: 'test' };
  const result = await SecureStore.getItemAsync('key', options);
  expect(result).toBe('value');
  expect(ExpoSecureStore.getValueWithKeyAsync).toHaveBeenCalledWith('key', options);
});

it(`deletes values`, async () => {
  const options = { keychainService: 'test' };
  await SecureStore.deleteItemAsync('key', options);
  expect(ExpoSecureStore.deleteValueWithKeyAsync).toHaveBeenCalledWith('key', options);
});

it(`checks for invalid keys`, async () => {
  ExpoSecureStore.getValueWithKeyAsync.mockImplementation(async () => `unexpected value`);

  await expect(SecureStore.getItemAsync(null as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.getItemAsync(true as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.getItemAsync({} as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.getItemAsync((() => {}) as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.getItemAsync('@')).rejects.toMatchSnapshot();

  expect(ExpoSecureStore.getValueWithKeyAsync).not.toHaveBeenCalled();
});

it(`checks for invalid values`, async () => {
  await expect(SecureStore.setItemAsync('key', null as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.setItemAsync('key', true as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.setItemAsync('key', {} as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.setItemAsync('key', (() => {}) as any)).rejects.toMatchSnapshot();

  expect(ExpoSecureStore.setValueWithKeyAsync).not.toHaveBeenCalled();
});
