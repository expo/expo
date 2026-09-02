export class AsyncWsTunnel {
  private serverUrl: string | null = null;

  constructor(
    public projectRoot: string,
    public port: number,
    public options: { useExpoAccount?: boolean } = {}
  ) {}

  getActiveUrl = jest.fn(() => this.serverUrl);

  startAsync = jest.fn(async () => {
    this.serverUrl = 'http://exp.ws-tunnel.dev/';
  });

  stopAsync = jest.fn(async () => {
    this.serverUrl = null;
  });
}
