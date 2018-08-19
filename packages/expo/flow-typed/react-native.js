// @flow

declare var __DEV__: boolean;

declare module 'react-native' {
  declare module.exports: any;
}

declare module 'react-native/Libraries/Core/Devtools/parseErrorStack' {
  declare type StackFrame = {
    column: ?number,
    file: string,
    lineNumber: number,
    methodName: string,
  };

  declare type ExtendedError = Error & {
    framesToPop?: number,
  };

  declare module.exports: (error: ExtendedError) => Array<StackFrame>;
}

declare module 'react-native/Libraries/Core/Devtools/symbolicateStackTrace' {
  import type { StackFrame } from 'react-native/Libraries/Core/Devtools/parseErrorStack';

  declare module.exports: (stack: Array<StackFrame>) => Promise<Array<StackFrame>>;
}
