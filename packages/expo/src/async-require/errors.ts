export class MetroServerError extends Error {
  code = 'METRO_SERVER_ERROR';

  constructor(
    errorObject: { message: string } & Record<string, any>,
    public url: string
  ) {
    super(errorObject.message);
    this.name = 'MetroServerError';

    for (const key in errorObject) {
      (this as any)[key] = errorObject[key];
    }
  }
}
