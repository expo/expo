import { ExpoDevMenu } from './ExpoDevMenu.types';
import WebUnsupportedError from './WebUnsupportedError';

export default {
  openMenu() {
    throw new WebUnsupportedError();
  },
  openProfile() {
    throw new WebUnsupportedError();
  },
  openSettings() {
    throw new WebUnsupportedError();
  },
} as ExpoDevMenu;
