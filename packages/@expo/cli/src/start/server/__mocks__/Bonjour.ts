export class Bonjour {
  constructor(
    public projectRoot: string,
    public port: number | undefined
  ) {}

  announceAsync = jest.fn(async () => ({}));
  closeAsync = jest.fn(async () => ({}));
}
