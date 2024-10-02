export class DevelopmentSession {
  constructor(
    public projectRoot: string,
    public url: string
  ) {}

  startAsync = jest.fn(async () => ({}));
  closeAsync = jest.fn(async () => ({}));
}
