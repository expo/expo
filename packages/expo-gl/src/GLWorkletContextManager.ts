import { ExpoWebGLRenderingContext } from './GLView.types';

// This method needs to be in a separate file because react-native-reanimated
// import wrapped in try catch does not work correctly with inlineRequires option
// in metro.config.js
//
// It looks like in generated bundle "react-native-reanimated" is not present
// in _dependencyMap, but references to it count it as if it was, e.g. bundle contains
// a line "(0, _$$_REQUIRE(_dependencyMap[15], "./GLUtils").configureLogging)(gl);"
// but dependencyMap contains only 15 elements
export function createWorkletContextManager(): {
  getContext: (contextId: number) => ExpoWebGLRenderingContext | undefined;
  unregister?: (contextId: number) => void;
} {
  try {
    // reanimated needs to be imported before any workletized code
    // is created, but we don't want to make it dependency on expo-gl.
    const { runOnUI } = require('react-native-reanimated');
    return {
      getContext: (contextId: number): ExpoWebGLRenderingContext | undefined => {
        'worklet';
        return global.__EXGLContexts?.[String(contextId)];
      },
      unregister: (contextId: number): void => {
        runOnUI((contextId: number) => {
          'worklet';
          if (global.__EXGLContexts) {
            delete global.__EXGLContexts[String(contextId)];
          }
        })(contextId);
      },
    };
  } catch {
    return {
      getContext: () => {
        throw new Error('Worklet runtime is not available');
      },
    };
  }
}
