import deprecatedModule from './deprecatedModule';

declare let module: any;

Object.defineProperties(module.exports, {
  Linking: {
    enumerable: true,
    get() {
      deprecatedModule(
        `import { Linking } from 'expo' -> import * as Linking from 'expo-linking'\n`,
        'Linking',
        'expo-linking'
      );
      return require('expo-linking');
    },
  },
});
