import ExpoSecureStore from '../ExpoSecureStore';
import * as SecureStore from '../SecureStore';

beforeEach(() => {
  jest.clearAllMocks();
});

const confirmationCases: {
  name: string;
  options: SecureStore.SecureStoreOptions | undefined;
  expectedOptions: SecureStore.SecureStoreOptions;
}[] = [
  { name: 'when omitted', options: undefined, expectedOptions: {} },
  {
    name: 'when confirmation is required',
    options: { requireConfirmation: true },
    expectedOptions: { requireConfirmation: true },
  },
  {
    name: 'when confirmation is not required',
    options: { requireConfirmation: false },
    expectedOptions: { requireConfirmation: false },
  },
];

describe.each(confirmationCases)(
  'forwards confirmation options $name',
  ({ options, expectedOptions }) => {
    it('when setting a value asynchronously', async () => {
      await SecureStore.setItemAsync('key', 'value', options);

      expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenLastCalledWith(
        'value',
        'key',
        expectedOptions
      );
    });

    it('when getting a value asynchronously', async () => {
      await SecureStore.getItemAsync('key', options);

      expect(ExpoSecureStore.getValueWithKeyAsync).toHaveBeenLastCalledWith('key', expectedOptions);
    });

    it('when setting a value synchronously', () => {
      SecureStore.setItem('key', 'value', options);

      expect(ExpoSecureStore.setValueWithKeySync).toHaveBeenLastCalledWith(
        'value',
        'key',
        expectedOptions
      );
    });

    it('when getting a value synchronously', () => {
      SecureStore.getItem('key', options);

      expect(ExpoSecureStore.getValueWithKeySync).toHaveBeenLastCalledWith('key', expectedOptions);
    });
  }
);

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

describe('requireAuthentication normalization', () => {
  it(`maps 'none' to no authentication`, async () => {
    await SecureStore.setItemAsync('key', 'value', { requireAuthentication: 'none' });

    expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenLastCalledWith('value', 'key', {
      requireAuthentication: undefined,
    });
  });

  it(`forwards string authentication modes`, async () => {
    await SecureStore.setItemAsync('key', 'value', { requireAuthentication: 'biometry' });
    expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenLastCalledWith('value', 'key', {
      requireAuthentication: 'biometry',
    });

    await SecureStore.setItemAsync('key', 'value', { requireAuthentication: 'deviceCredentials' });
    expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenLastCalledWith('value', 'key', {
      requireAuthentication: 'deviceCredentials',
    });
  });

  it(`accepts deprecated boolean values and warns once`, async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await SecureStore.setItemAsync('key', 'value', { requireAuthentication: true });
    expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenLastCalledWith('value', 'key', {
      requireAuthentication: 'biometry',
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenLastCalledWith(expect.stringContaining('deprecated'));

    await SecureStore.setItemAsync('key', 'value', { requireAuthentication: false });
    expect(ExpoSecureStore.setValueWithKeyAsync).toHaveBeenLastCalledWith('value', 'key', {
      requireAuthentication: undefined,
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it(`rejects invalid values`, async () => {
    await expect(
      SecureStore.setItemAsync('key', 'value', { requireAuthentication: 'invalid' as any })
    ).rejects.toThrow('Invalid value for requireAuthentication');

    expect(ExpoSecureStore.setValueWithKeyAsync).not.toHaveBeenCalled();
  });
});

it(`checks for invalid values`, async () => {
  await expect(SecureStore.setItemAsync('key', null as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.setItemAsync('key', true as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.setItemAsync('key', {} as any)).rejects.toMatchSnapshot();
  await expect(SecureStore.setItemAsync('key', (() => {}) as any)).rejects.toMatchSnapshot();

  expect(ExpoSecureStore.setValueWithKeyAsync).not.toHaveBeenCalled();
});
