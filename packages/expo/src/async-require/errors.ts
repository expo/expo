export class MetroServerError extends Error {
  code = 'METRO_SERVER_ERROR';
  url: string;

  constructor(errorObject: { message: string } & Record<string, any>, url: string) {
    super(errorObject.message);
    this.name = 'MetroServerError';
    this.url = url;
    for (const key in errorObject) {
      (this as any)[key] = errorObject[key];
    }
  }
}
