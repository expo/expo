import { NativeModules } from 'react-native';
import ReanimatedModuleCompat from './ReanimatedModuleCompat';
import { nativeShouldBeMock } from './reanimated2/PlatformChecker';

let exportedModule;
if (nativeShouldBeMock()) {
  exportedModule = ReanimatedModuleCompat;
} else {
  const { ReanimatedModule } = NativeModules;
  exportedModule = ReanimatedModule;
}

export default exportedModule;
