// @flow

import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import uuidv4 from 'uuid/v4';
import parser from 'ua-parser-js';

class ExponentConstants {
  _sessionId = uuidv4();

  get name() {
    return 'ExponentConstants';
  }

  get sessionId() {
    return this._sessionId;
  }

  get platform() {
    return { web: parser(navigator.userAgent) };
  }

  get isDevice() {
    return true;
  }

  get expoVersion() {
    return '32';
  }

  constructor() {
    this.linkingUri = global.location.href.split('?')[0].split('#')[0];

    const invalidConstants = [
      'expoRuntimeVersion',
      'deviceName',
      'systemFonts',
      'statusBarHeight',
      'deviceYearClass',
    ];
    for (let constantName of invalidConstants) {
      Object.defineProperty(this, constantName, {
        get() {
          console.warn(`${this.name}.${constantName} is not implemented`);
          return null;
        },
      });
    }
  }

  getWebViewUserAgentAsync(): Promise {
    const { navigator = {} } = global;
    return canUseDOM ? navigator.userAgent : null;
  }
}

export default new ExponentConstants();
