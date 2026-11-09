import net from 'node:net';
import os from 'node:os';

import { getIpAddressAsync } from '../ip';
import { _resolvePortAsync, ensurePortAvailabilityAsync } from '../port';

jest.unmock('net');
jest.unmock('node:net');
jest.unmock('os');
jest.unmock('node:os');
jest.mock('../ip', () => ({ getIpAddressAsync: jest.fn() }));
jest.mock('../interactive', () => ({ isInteractive: () => false }));
jest.mock('../getRunningProcess', () => ({ getRunningProcess: async () => null }));
jest.mock('../../log');

const lanAddress = Object.values(os.networkInterfaces())
  .flat()
  .find((entry) => entry?.family === 'IPv4' && !entry.internal)?.address;
const itWithLan = lanAddress ? it : it.skip;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getIpAddressAsync).mockResolvedValue(lanAddress ?? '127.0.0.1');
});

async function withPortAsync(host: string, test: (port: number) => Promise<void>) {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, host, resolve);
  });
  const { port } = server.address() as net.AddressInfo;
  try {
    await test(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

it.each(['127.0.0.1', '0.0.0.0'])(
  'rejects an explicitly requested LAN port held on %s',
  async (host) => {
    await withPortAsync(host, async (port) => {
      await expect(
        _resolvePortAsync('/', { defaultPort: port, preferredPort: port })
      ).rejects.toThrow(/Port .* is unavailable/);
    });
  }
);

itWithLan('checks the advertised LAN address without reserving it in localhost mode', async () => {
  await withPortAsync(lanAddress!, async (port) => {
    await expect(
      _resolvePortAsync('/', { defaultPort: port, preferredPort: port })
    ).rejects.toThrow(/Port .* is unavailable/);
    jest.mocked(getIpAddressAsync).mockClear();
    await expect(
      _resolvePortAsync('/', { defaultPort: port, preferredPort: port, host: '127.0.0.1' })
    ).resolves.toBe(port);
    await expect(
      _resolvePortAsync('/', { defaultPort: 0, preferredPort: port, host: '127.0.0.1' })
    ).resolves.toBe(port);
    expect(getIpAddressAsync).not.toHaveBeenCalled();
  });
});

it('checks the loopback bind in localhost mode', async () => {
  await withPortAsync('127.0.0.1', async (port) => {
    await expect(
      _resolvePortAsync('/', { defaultPort: port, preferredPort: port, host: '127.0.0.1' })
    ).rejects.toThrow(/Port .* is unavailable/);
    expect(getIpAddressAsync).not.toHaveBeenCalled();
  });
});

itWithLan('skips the advertised LAN address when selecting --port 0', async () => {
  await withPortAsync(lanAddress!, async (port) => {
    await expect(
      _resolvePortAsync('/', { defaultPort: 0, preferredPort: port })
    ).resolves.toBeGreaterThan(port);
  });
});

itWithLan('rechecks the advertised LAN address after a native build', async () => {
  await withPortAsync(lanAddress!, async (port) => {
    await expect(ensurePortAvailabilityAsync('/', { port })).rejects.toThrow(/became busy/);
  });
});
