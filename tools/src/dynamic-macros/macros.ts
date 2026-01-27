import crypto from 'crypto';

import { getExpoGoSDKVersionAsync } from '../ProjectVersions';

export default {
  async TEST_APP_URI() {
    if (process.env.TEST_SUITE_URI) {
      return process.env.TEST_SUITE_URI;
    }
    return '';
  },

  async TEST_CONFIG() {
    if (process.env.TEST_CONFIG) {
      return process.env.TEST_CONFIG;
    } else {
      return '';
    }
  },

  async TEST_SERVER_URL() {
    return 'TODO';
  },

  async TEST_RUN_ID() {
    return process.env.UNIVERSE_BUILD_ID || crypto.randomUUID();
  },

  async TEMPORARY_SDK_VERSION(): Promise<string> {
    return await getExpoGoSDKVersionAsync();
  },
};
