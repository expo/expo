// Side effect file to load shared object support in worklets

import { installOnUIRuntime } from 'expo';

import { registerSharedObjectSerializer } from './index';

installOnUIRuntime();

try {
  registerSharedObjectSerializer();
} catch {
  // react-native-worklets is an optional dependency
}
