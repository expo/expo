export class DevelopmentSession {
  constructor(public projectRoot: string, public url: string) {}

  startDevSessionAsync = jest.fn(async () => ({}));
  stopSession = jest.fn();
}
