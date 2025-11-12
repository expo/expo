// This will be changed to `ExperimentalModalStack` in @expo/cli/src/start/server/metro/withMetroMultiPlatform.ts
// When the `EXPO_UNSTABLE_WEB_MODAL` env variable is truthy.
import Stack from './_web-modal';
import { StackScreen, StackHeader } from './stack-utils';

Stack.Screen = StackScreen;
Stack.Header = StackHeader;

export { Stack };

export default Stack;
