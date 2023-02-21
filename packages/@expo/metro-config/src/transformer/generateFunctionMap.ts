import type { generateFunctionMap as generateFunctionMapType } from 'metro-source-map';

import { env } from '../env';

type GenerateFunctionMapParams = Parameters<typeof generateFunctionMapType>;

export function generateFunctionMap(
  ...props: GenerateFunctionMapParams
): ReturnType<typeof generateFunctionMapType> | null {
  //  `x_facebook_sources` is a source map feature that we disable by default since it isn't documented
  // and doesn't appear to add much value to the DX, it also increases bundle time, and source map size.
  // The feature supposedly provides improved function names for anonymous functions, but we will opt towards
  // linting to prevent users from adding anonymous functions for important features like React components.
  //
  // Here is an example stack trace for a component that throws an error
  // in the root component (which is an anonymous function):
  //
  // Before:
  // - <anonymous> App.js:5:9
  // - renderApplication renderApplication.js:54:5
  // - runnables.appKey.run AppRegistry.js:117:26
  //
  // After:
  // - _default App.js:5:9
  // - renderApplication renderApplication.js:54:5
  // - run AppRegistry.js:117:26
  //
  if (env.EXPO_USE_FB_SOURCES) {
    return (require('metro-source-map') as typeof import('metro-source-map')).generateFunctionMap(
      ...props
    );
  }
  return null;
}
