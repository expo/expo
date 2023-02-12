export class AsyncNgrok {
  private serverUrl: string | null = null;

  getActiveUrl = jest.fn(() => this.serverUrl);

  startAsync = jest.fn(async () => {
    this.serverUrl = 'http://exp.tunnel.dev/foobar';
  });

  stopAsync = jest.fn(async () => {
    this.serverUrl = null;
  });
}
