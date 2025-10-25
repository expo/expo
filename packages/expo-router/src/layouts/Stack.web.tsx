// This will be changed to `ExperimentalModalStack` in @expo/cli/src/start/server/metro/withMetroMultiPlatform.ts
// When the `EXPO_UNSTABLE_WEB_MODAL` env variable is truthy.
import { StackScreen, StackHeader } from './StackElements';
import Stack from './_web-modal';

Stack.Screen = StackScreen;
Stack.Header = StackHeader;

export { Stack };

export default Stack;
