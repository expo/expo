import { ExpoRouterReactNavigationCheck } from '../ExpoRouterReactNavigationCheck';

const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '56.0.0',
  },
  projectRoot: '/tmp/project',
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('runAsync', () => {
  it('returns isSuccessful = true if expo-router is not installed', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        dependencies: { '@react-navigation/native': '^7.0.0' },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toEqual([]);
  });

  it('returns isSuccessful = true if expo-router is installed but no @react-navigation/* package is', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        dependencies: { 'expo-router': '^6.0.0' },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
    expect(result.issues).toEqual([]);
  });

  it('returns isSuccessful = false if expo-router and @react-navigation/native are both in dependencies', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        dependencies: {
          'expo-router': '^6.0.0',
          '@react-navigation/native': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toContain('@react-navigation/native');
    expect(result.advice).toHaveLength(1);
  });

  it('returns isSuccessful = false if @react-navigation/* is in devDependencies', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        dependencies: { 'expo-router': '^6.0.0' },
        devDependencies: { '@react-navigation/stack': '^7.0.0' },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues[0]).toContain('@react-navigation/stack');
  });

  it('returns isSuccessful = false if expo-router is in devDependencies', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        devDependencies: {
          'expo-router': '^6.0.0',
          '@react-navigation/native': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues[0]).toContain('@react-navigation/native');
  });

  it('lists every offending @react-navigation/* package in the message, sorted', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        dependencies: {
          'expo-router': '^6.0.0',
          '@react-navigation/stack': '^7.0.0',
          '@react-navigation/native': '^7.0.0',
          '@react-navigation/bottom-tabs': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    const message = result.issues[0];
    const nativeIdx = message.indexOf('@react-navigation/native');
    const stackIdx = message.indexOf('@react-navigation/stack');
    const tabsIdx = message.indexOf('@react-navigation/bottom-tabs');
    expect(tabsIdx).toBeGreaterThan(-1);
    expect(nativeIdx).toBeGreaterThan(tabsIdx);
    expect(stackIdx).toBeGreaterThan(nativeIdx);
  });

  it('ignores peerDependencies (the check targets app projects, not libraries)', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        peerDependencies: {
          'expo-router': '^6.0.0',
          '@react-navigation/native': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('handles same package in both dependencies and devDependencies without duplicating it in the message', async () => {
    const check = new ExpoRouterReactNavigationCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'name',
        version: '1.0.0',
        dependencies: {
          'expo-router': '^6.0.0',
          '@react-navigation/native': '^7.0.0',
        },
        devDependencies: {
          '@react-navigation/native': '^7.0.0',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    const occurrences = result.issues[0].match(/@react-navigation\/native/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('has sdkVersionRange = >=56.0.0 <57.0.0', () => {
    const check = new ExpoRouterReactNavigationCheck();
    expect(check.sdkVersionRange).toBe('>=56.0.0 <57.0.0');
  });
});
