import reanimatedJS from '../js-reanimated';
import { shouldBeUseWeb } from '../PlatformChecker';
import { NativeReanimated } from './NativeReanimated';

let exportedModule;
if (shouldBeUseWeb()) {
  exportedModule = reanimatedJS;
} else {
  exportedModule = new NativeReanimated();
}

export default exportedModule as NativeReanimated;
