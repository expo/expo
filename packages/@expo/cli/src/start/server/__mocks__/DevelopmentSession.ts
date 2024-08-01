export class DevelopmentSession {
  constructor(
    public projectRoot: string,
    public url: string
  ) {}

  startAsync = jest.fn(async () => ({}));
  stopNotifying = jest.fn();
  closeAsync = jest.fn(async () => ({}));
}
