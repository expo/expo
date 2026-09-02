// The two tiny reads the builders need: is EAS configured, and does this host have a LAN address.

import { vol } from 'memfs';
import os from 'os';

import { resolveExpoGoLanUrl, resolveLanHost } from '../network';
import { dependsOnDevClientSync, easJsonExistsSync } from '../projectFiles';

const projectRoot = '/project';

/** One entry of `os.networkInterfaces()`, with only the fields the resolver reads. */
function iface(overrides: Partial<os.NetworkInterfaceInfo>): os.NetworkInterfaceInfo {
  return {
    address: '10.0.0.1',
    netmask: '255.255.255.0',
    family: 'IPv4',
    mac: '00:00:00:00:00:00',
    internal: false,
    cidr: null,
    ...overrides,
  } as os.NetworkInterfaceInfo;
}

function mockInterfaces(interfaces: Record<string, os.NetworkInterfaceInfo[] | undefined>) {
  jest.spyOn(os, 'networkInterfaces').mockReturnValue(interfaces as any);
}

afterEach(() => {
  jest.restoreAllMocks();
  vol.reset();
});

describe(resolveLanHost, () => {
  it(`should return the first external IPv4 address`, () => {
    mockInterfaces({
      lo0: [iface({ address: '127.0.0.1', internal: true })],
      en0: [iface({ address: '192.168.1.5' })],
    });

    expect(resolveLanHost()).toBe('192.168.1.5');
  });

  it(`should skip loopback and IPv6 addresses`, () => {
    mockInterfaces({
      lo0: [iface({ address: '127.0.0.1', internal: true })],
      en0: [iface({ address: 'fe80::1', family: 'IPv6' })],
    });

    expect(resolveLanHost()).toBeNull();
  });

  it(`should read the numeric family older Node versions report`, () => {
    mockInterfaces({ en0: [iface({ family: 4 as unknown as 'IPv4', address: '10.1.2.3' })] });

    expect(resolveLanHost()).toBe('10.1.2.3');
  });

  it(`should report no address on a host without one`, () => {
    mockInterfaces({ lo0: undefined });

    expect(resolveLanHost()).toBeNull();
  });
});

describe(resolveExpoGoLanUrl, () => {
  it(`should build the exp:// URL a phone on the same network opens`, () => {
    mockInterfaces({ en0: [iface({ address: '192.168.1.5' })] });

    expect(resolveExpoGoLanUrl(8081)).toBe('exp://192.168.1.5:8081');
    expect(resolveExpoGoLanUrl(8082)).toBe('exp://192.168.1.5:8082');
  });

  it(`should report no URL without a LAN address`, () => {
    mockInterfaces({});

    expect(resolveExpoGoLanUrl(8081)).toBeNull();
  });
});

describe(easJsonExistsSync, () => {
  it(`should find a checked-in eas.json`, () => {
    vol.fromJSON({ [`${projectRoot}/eas.json`]: '{"build":{}}' });

    expect(easJsonExistsSync(projectRoot)).toBe(true);
  });

  it(`should report a project without one`, () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(easJsonExistsSync(projectRoot)).toBe(false);
  });

  it(`should not mistake a directory for the file`, () => {
    vol.fromJSON({ [`${projectRoot}/eas.json/keep`]: '' });

    expect(easJsonExistsSync(projectRoot)).toBe(false);
  });
});

describe(dependsOnDevClientSync, () => {
  it(`should find expo-dev-client in the dependencies`, () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        dependencies: { expo: '54.0.0', 'expo-dev-client': '~5.0.0' },
      }),
    });

    expect(dependsOnDevClientSync(projectRoot)).toBe(true);
  });

  it(`should find it in the dev dependencies too`, () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        devDependencies: { 'expo-dev-client': '~5.0.0' },
      }),
    });

    expect(dependsOnDevClientSync(projectRoot)).toBe(true);
  });

  it(`should report a project that does not declare it`, () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ dependencies: { expo: '54.0.0' } }),
    });

    expect(dependsOnDevClientSync(projectRoot)).toBe(false);
  });

  it(`should report false for a missing or unreadable package.json`, () => {
    expect(dependsOnDevClientSync(projectRoot)).toBe(false);

    vol.fromJSON({ [`${projectRoot}/package.json`]: 'not json' });
    expect(dependsOnDevClientSync(projectRoot)).toBe(false);
  });
});
