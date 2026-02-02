import net from 'node:net';

async function testHostPortAsync(port: number, host: string | null): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen({ port, host }, () => {
      server.once('close', () => {
        setTimeout(() => resolve(true), 0);
      });
      server.close();
    });
    server.once('error', (_error) => {
      setTimeout(() => resolve(false), 0);
    });
  });
}

export async function testPortAsync(port: number, hostnames?: (string | null)[]): Promise<boolean> {
  if (!hostnames?.length) {
    hostnames = [null];
  }
  for (const host of hostnames) {
    if (!(await testHostPortAsync(port, host))) {
      return false;
    }
  }
  return true;
}

export async function freePortAsync(
  portStart: number,
  hostnames?: (string | null)[]
): Promise<number | null> {
  for (let port = portStart; port <= 65_535; port++) {
    if (await testPortAsync(port, hostnames)) {
      return port;
    }
  }
  return null;
}
