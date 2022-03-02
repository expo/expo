export class AsyncNgrok {
  /** Info about the currently running instance of ngrok. */
  private serverUrl: string | null = null;

  getActiveUrl = jest.fn(() => this.serverUrl);

  startAsync = jest.fn(async () => {
    this.serverUrl = 'http://exp.tunnel.dev/foobar';
  });

  stopAsync = jest.fn(async () => {
    this.serverUrl = null;
  });
}
