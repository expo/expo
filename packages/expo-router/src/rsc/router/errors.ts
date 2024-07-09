/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

export class ReactServerError extends Error {
  code = 'REACT_SERVER_ERROR';

  constructor(
    message: string,
    public url: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ReactServerError';
  }
}
