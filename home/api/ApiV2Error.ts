import ExtendableError from 'es6-error';

export default class ApiV2Error extends ExtendableError {
  code: string;
  serverStack?: string;
  metadata?: object;

  constructor(message: string, code: string = 'UNKNOWN') {
    super(message);
    this.code = code;
  }
}
