// Importing and calling this method in user space prevents it from taking effect early enough;
// errors would still be enabled for modules imported at the root scope. Instead, this file lets
// people disable the errors by adding `import 'expo/disable-missing-native-module-errors';` which
// does take effect early enough.
import { disableMissingNativeModuleErrors } from './build/proxies/NativeModules';
disableMissingNativeModuleErrors();
