export class DevelopmentSession {
  constructor(public projectRoot: string, public url: string) {}

  startAsync = jest.fn(async () => ({}));
  stop = jest.fn();
}
