import { ExpoDevMenu } from './ExpoDevMenu.types';
import WebUnsupportedError from './WebUnsupportedError';

export default {
  openMenu() {
    throw new WebUnsupportedError();
  },
  closeMenu() {
    throw new WebUnsupportedError();
  },
  hideMenu() {
    throw new WebUnsupportedError();
  },
  addDevMenuCallbacks() {
    throw new WebUnsupportedError();
  },
} as ExpoDevMenu;
