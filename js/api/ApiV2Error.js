/**
 * @providesModule ApiV2Error
 * @flow
 */
'use strict';

import ExtendableError from 'es6-error';

export default class ApiV2Error extends ExtendableError {
  code: string;
  serverStack: ?string;

  constructor(message: string, code: string = 'UNKNOWN') {
    super(message);
    this.code = code;
  }
}
