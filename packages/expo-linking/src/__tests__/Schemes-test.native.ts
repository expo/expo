import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { collectManifestSchemes, resolveScheme } from '../Schemes';

describe(collectManifestSchemes, () => {
  const consoleWarn = console.warn;
  const manifest = Constants.__rawManifest_TEST;
  const executionEnvironment = Constants.executionEnvironment;

  afterEach(() => {
    console.warn = consoleWarn;
    Constants.executionEnvironment = executionEnvironment;
    Constants.__rawManifest_TEST = manifest;
  });

  beforeEach(() => {
    console.warn = jest.fn();
    Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
    Constants.__rawManifest_TEST = {
      ...manifest,
      scheme: 'demo',
    };
  });

  it(`collects none`, () => {
    Constants.__rawManifest_TEST = {
      ...manifest,
      scheme: undefined,
    };
    expect(collectManifestSchemes()).toStrictEqual([]);
  });
  it(`collects default`, () => {
    Constants.__rawManifest_TEST = {
      ...manifest,
      scheme: 'demo',
    };
    expect(collectManifestSchemes()).toStrictEqual(['demo']);
  });
  it(`collects all`, () => {
    Constants.__rawManifest_TEST = {
      ...manifest,
      // @ts-ignore An array of strings is a secret feature until we drop turtle v1
      scheme: ['scheme.1', 'scheme.2'],
      ios: {
        // @ts-ignore An array of strings is a secret feature until we drop turtle v1
        scheme: ['ios.scheme.1', null],
        bundleIdentifier: 'ios.bundleIdentifier',
      },
      android: {
        // @ts-ignore An array of strings is a secret feature until we drop turtle v1
        scheme: ['android.scheme.1'],
        package: 'android.package',
      },
    };

    expect(collectManifestSchemes()).toStrictEqual(
      Platform.select({
        ios: ['scheme.1', 'scheme.2', 'ios.scheme.1'],
        android: ['scheme.1', 'scheme.2', 'android.scheme.1'],
      })
    );
  });
});

describe(resolveScheme, () => {
  const consoleWarn = console.warn;
  const manifest = Constants.__rawManifest_TEST;
  const executionEnvironment = Constants.executionEnvironment;

  afterEach(() => {
    console.warn = consoleWarn;
    Constants.executionEnvironment = executionEnvironment;
    Constants.__rawManifest_TEST = manifest;
  });

  beforeEach(() => {
    console.warn = jest.fn();
    Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: 'demo',
    };
  });

  it(`collects default in client`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: undefined,
    };
    expect(resolveScheme({})).toStrictEqual('exp');
    expect(console.warn).toBeCalled();
  });

  it(`allows for compliant alternative in client`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: 'unused',
    };
    expect(resolveScheme({ scheme: 'exps' })).toStrictEqual('exps');
  });

  it(`silently rejects non-compliant alternative in client`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: 'unused',
    };
    expect(resolveScheme({ scheme: 'foobar' })).toStrictEqual('exp');
  });

  //

  it(`uses property over manifest in bare`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: 'unused',
    };
    expect(resolveScheme({ scheme: 'foobar' })).toStrictEqual('foobar');
  });
  it(`uses manifest when property is missing in bare`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: 'foobar',
    };
    expect(resolveScheme({})).toStrictEqual('foobar');
  });
  it(`warns when multiple schemes are defined in bare`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      // @ts-ignore An array of strings is a secret feature until we drop turtle v1
      scheme: ['foobar', 'beta'],
    };
    expect(resolveScheme({})).toStrictEqual('foobar');
    expect(console.warn).toBeCalled();
  });
  it(`warns no scheme is defined in but the app id is in bare`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: undefined,
      ios: { bundleIdentifier: 'bundleIdentifier' },
      android: { package: 'package' },
    };
    expect(resolveScheme({})).toStrictEqual(
      Platform.select({
        ios: 'bundleIdentifier',
        android: 'package',
      })
    );
    expect(console.warn).toBeCalled();
  });
  it(`throws when no scheme is provided in bare`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    Constants.__rawManifest_TEST = {
      ...Constants.__rawManifest_TEST,
      scheme: undefined,
    };

    expect(() => resolveScheme({})).toThrow();
  });
  it(`throws when no manifest is linked in bare`, () => {
    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    // @ts-ignore: invalid manifest for test
    Constants.__rawManifest_TEST = {};
    expect(() => resolveScheme({})).toThrow('expo-constants manifest');
  });
});
