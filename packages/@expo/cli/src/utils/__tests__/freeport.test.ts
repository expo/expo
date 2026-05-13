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
});
