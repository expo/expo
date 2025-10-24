// Keep module interface compatible with
// https://github.com/facebook/react-native/blob/50b1bec2d56cd1b06ceb0be284a30fd90e39c342/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js

// Import all types from react-native's LogBoxLog to ensure type compatibility
// This file replaced the default react-native LogBoxLog parser
import type { LogBoxLogData, LogLevel } from 'react-native/Libraries/LogBox/Data/LogBoxLog';
import type {
  Category,
  CodeFrame,
  ComponentStack,
  ComponentStackType,
  Message,
} from 'react-native/Libraries/LogBox/Data/parseLogBoxLog';
import type { ExtendedExceptionData } from 'react-native/Libraries/LogBox/LogBox';

// We intentionally import from our web-specific parseLogBoxLog implementation to ensure the conversion logic is correct.
import type { MetroStackFrame as ExpoMetroStackFrame } from './Types';
import type { ExtendedExceptionData as ExpoExtendedExceptionData } from './parseLogBoxLog';
// End of web-specific imports
import * as parseLogBoxLogWeb from './parseLogBoxLog';
import { parseErrorStack } from '../utils/parseErrorStack';
import { withoutANSIColorStyles as withoutANSIColorStylesHelper } from '../utils/withoutANSIStyles';

// Exported method must be compatible with upstream React Native.
export { parseInterpolation } from './parseLogBoxLog';

export function withoutANSIColorStyles<T>(text: T): T {
  return withoutANSIColorStylesHelper(text);
}

export function parseLogBoxException(error: ExtendedExceptionData): LogBoxLogData {
  const parsed = parseLogBoxLogWeb.parseLogBoxException(error as ExpoExtendedExceptionData);
  return {
    ...parsed,
    // @ts-ignore metro types only accepts undefined | number for column
    stack: parsed.stack,
    componentStack: parsed.componentStack.map(convertMetroToComponentFrame),
    level: ['resolution', 'static'].includes(parsed.level) ? 'syntax' : (parsed.level as LogLevel),
    componentStackType: 'stack',
    extraData: {},
    onNotificationPress: () => {},
    // @ts-ignore metro types only accepts undefined | number for location
    codeFrame: parsed.codeFrame['stack'],
    componentCodeFrame: parsed.codeFrame['component'],
  };
}

export function parseLogBoxLog(args: any[]): {
  componentStack: ComponentStack;
  componentStackType: ComponentStackType;
  category: Category;
  message: Message;
} {
  const parsed = parseLogBoxLogWeb.parseLogBoxLog(args);
  return {
    ...parsed,
    componentStack: parsed.componentStack.map(convertMetroToComponentFrame),
    componentStackType: 'stack',
  };
}

function convertMetroToComponentFrame(frame: ExpoMetroStackFrame): CodeFrame {
  return {
    content: frame.methodName,
    collapse: frame.collapse || false,
    fileName: frame.file == null ? 'unknown' : frame.file,
    location: {
      column: frame.column == null ? -1 : frame.column,
      row: frame.lineNumber == null ? -1 : frame.lineNumber,
    },
  };
}

// Below
// Not used in Expo code, but required for matching exports with upstream.
// https://github.com/krystofwoldrich/react-native/blob/7db31e2fca0f828aa6bf489ae6dc4adef9b7b7c3/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js#L220

export function parseComponentStack(message: string): {
  type: 'stack';
  stack: readonly CodeFrame[];
} {
  // We removed legacy parsing since we are in control of the React version used.
  const stack = parseErrorStack(message);
  return {
    type: 'stack',
    stack: stack.map((frame) => ({
      content: frame.methodName,
      collapse: frame.collapse || false,
      fileName: frame.file == null ? 'unknown' : frame.file,
      location: {
        column: frame.column == null ? -1 : frame.column,
        row: frame.lineNumber == null ? -1 : frame.lineNumber,
      },
    })),
  };
}

export function hasComponentStack(args: any[]): boolean {
  for (const arg of args) {
    if (typeof arg === 'string' && isComponentStack(arg)) {
      return true;
    }
  }
  return false;
}

const RE_COMPONENT_STACK_LINE_OLD = / {4}in/;
const RE_COMPONENT_STACK_LINE_NEW = / {4}at/;
const RE_COMPONENT_STACK_LINE_STACK_FRAME = /@.*\n/;

function isComponentStack(consoleArgument: string) {
  const isOldComponentStackFormat = RE_COMPONENT_STACK_LINE_OLD.test(consoleArgument);
  const isNewComponentStackFormat = RE_COMPONENT_STACK_LINE_NEW.test(consoleArgument);
  const isNewJSCComponentStackFormat = RE_COMPONENT_STACK_LINE_STACK_FRAME.test(consoleArgument);

  return isOldComponentStackFormat || isNewComponentStackFormat || isNewJSCComponentStackFormat;
}
