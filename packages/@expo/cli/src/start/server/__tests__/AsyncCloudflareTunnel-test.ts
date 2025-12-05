import { EventEmitter } from 'events';

import { AsyncCloudflareTunnel } from '../AsyncCloudflareTunnel';

jest.mock('../../../log');
jest.mock('../../../utils/delay', () => ({
  delayAsync: jest.fn(async () => {}),
  resolveWithTimeout: jest.fn(async (fn) => fn()),
}));

type Spawned = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: jest.Mock;
};

const mockSpawn = jest.fn();
jest.mock('node:child_process', () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
}));

function createSpawned(url?: string): Spawned {
  const cp: Spawned = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: jest.fn(function kill(this: Spawned) {
      this.emit('exit', 0);
    }),
  });

  if (url) {
    // Resolve on next tick once listeners are registered.
    setImmediate(() => {
      cp.stdout.emit('data', Buffer.from(`Your quick Tunnel has been created! ${url}\n`));
    });
  }

  return cp;
}

describe('AsyncCloudflareTunnel', () => {
  const projectRoot = '/';
  const port = 3000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects and exposes active url', async () => {
    const url = 'https://example.trycloudflare.com';
    mockSpawn.mockReturnValueOnce(createSpawned(url));

    const tunnel = new AsyncCloudflareTunnel(projectRoot, port);
    expect(tunnel.getActiveUrl()).toBeNull();
    await tunnel.startAsync();
    expect(tunnel.getActiveUrl()).toBe(url);
  });

  it('stops and kills child process', async () => {
    const url = 'https://stop.trycloudflare.com';
    const proc = createSpawned(url);
    mockSpawn.mockReturnValueOnce(proc);

    const tunnel = new AsyncCloudflareTunnel(projectRoot, port);
    await tunnel.startAsync();
    await tunnel.stopAsync();

    expect(proc.kill).toHaveBeenCalled();
    expect(tunnel.getActiveUrl()).toBeNull();
  });

  it('throws when cloudflared fails to launch', async () => {
    mockSpawn.mockImplementationOnce(() => {
      throw new Error('missing binary');
    });

    const tunnel = new AsyncCloudflareTunnel(projectRoot, port);
    await expect(tunnel.startAsync()).rejects.toThrow(/cloudflared/i);
  });
});
