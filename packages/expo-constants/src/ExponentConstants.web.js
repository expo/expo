// @flow

import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import uuidv4 from 'uuid/v4';
import parser from 'ua-parser-js';

const sessionId = uuidv4();
class ExponentConstants {
  get name() {
    return 'ExponentConstants';
  }

  get sessionId() {
    return sessionId;
  }

  get platform() {
    return { web: parser(navigator.userAgent) };
  }

  constructor() {
    this.expoVersion = '32';

    this.expoRuntimeVersion = null;

    this.linkingUri = global.location.href.split('?')[0].split('#')[0];

    this.isDevice = true;

    const invalidConstants = ['deviceName', 'systemFonts', 'statusBarHeight', 'deviceYearClass'];
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
