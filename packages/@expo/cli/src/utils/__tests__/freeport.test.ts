import net from 'node:net';

import { freePortAsync, testPortAsync } from '../freeport';

jest.unmock('net');
jest.unmock('node:net');

describe(freePortAsync, () => {
  it(`returns the starting port if it is free`, async () => {
    // Find a port we know is free by binding to 0
    const server = net.createServer();
    const freePort = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        server.close(() => resolve(port));
      });
    });

    const result = await freePortAsync(freePort);
    expect(result).toBe(freePort);
  });
});

describe(testPortAsync, () => {
  it(`returns true for a free port`, async () => {
    const server = net.createServer();
    const freePort = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        server.close(() => resolve(port));
      });
    });

    expect(await testPortAsync(freePort)).toBe(true);
  });

  it(`returns false for a busy port`, async () => {
    const server = net.createServer();
    const busyPort = await new Promise<number>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });

    try {
      expect(await testPortAsync(busyPort)).toBe(false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it(`returns false when the port is only taken on 127.0.0.1`, async () => {
    // Regression test for Windows, where binding the unspecified address
    // succeeds even though 127.0.0.1 is taken: the default probe must check
    // the loopback addresses too.
    const server = net.createServer();
    const busyPort = await new Promise<number>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });

    try {
      expect(await testPortAsync(busyPort)).toBe(false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it(`returns false when the port is only taken on ::1`, async () => {
    const server = net.createServer();
    const busyPort = await new Promise<number | null>((resolve) => {
      server.once('error', () => resolve(null));
      server.listen(0, '::1', () => {
        const addr = server.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });
    // Skip the assertion when this machine has no IPv6 loopback.
    if (busyPort == null) {
      return;
    }

    try {
      expect(await testPortAsync(busyPort)).toBe(false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it(`only probes the given hosts when hostnames are passed`, async () => {
    const server = net.createServer();
    const busyPort = await new Promise<number>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });

    try {
      // The 127.0.0.1 holder conflicts with an explicit 127.0.0.1 probe...
      expect(await testPortAsync(busyPort, ['127.0.0.1'])).toBe(false);
      // ...but not with a probe of the IPv6 loopback only.
      expect(await testPortAsync(busyPort, ['::1'])).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
