export class AsyncCloudflareTunnel {
  private serverUrl: string | null = null;

  getActiveUrl = jest.fn(() => this.serverUrl);

  startAsync = jest.fn(async () => {
    this.serverUrl = 'http://exp.cloudflare-tunnel.dev/foobar';
  });

  stopAsync = jest.fn(async () => {
    this.serverUrl = null;
  });
}
