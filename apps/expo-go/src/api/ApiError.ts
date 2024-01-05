import ExtendableError from 'es6-error';

export class ApiError extends ExtendableError {
  code: string;
  serverStack?: string;
  metadata?: object;

  constructor(message: string, code: string = 'UNKNOWN') {
    super(message);
    this.code = code;
  }
}
