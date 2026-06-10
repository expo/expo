// Keep module interface compatible with
// https://github.com/facebook/react-native/blob/50b1bec2d56cd1b06ceb0be284a30fd90e39c342/packages/react-native/Libraries/LogBox/Data/parseLogBoxLog.js
// NOTE(@kitten): Types here were converted/copied manually from Flow. Unclear where they were originally defined
// TODO(@kitten): There were type errors here after conversion; needs a review!
// We intentionally import from our web-specific parseLogBoxLog implementation to ensure the conversion logic is correct.
import { withoutANSIColorStyles as withoutANSIColorStylesHelper } from '@expo/log-box-utils';
// End of web-specific imports
import * as parseLogBoxLogWeb from './parseLogBoxLog';
import { parseErrorStack } from '../utils/parseErrorStack';
// Exported method must be compatible with upstream React Native.
export { parseInterpolation } from './parseLogBoxLog';
export function withoutANSIColorStyles(text) {
    return withoutANSIColorStylesHelper(text);
}
export function parseLogBoxException(error) {
    const parsed = parseLogBoxLogWeb.parseLogBoxException(error);
    return {
        ...parsed,
        // @ts-ignore metro types only accepts undefined | number for column
        stack: parsed.stack,
        componentStack: parsed.componentStack.map(convertMetroToComponentFrame),
        level: ['resolution', 'static'].includes(parsed.level) ? 'syntax' : parsed.level,
        componentStackType: 'stack',
        extraData: {},
        onNotificationPress: () => { },
        // @ts-ignore metro types only accepts undefined | number for location
        codeFrame: parsed.codeFrame['stack'],
        componentCodeFrame: parsed.codeFrame['component'],
    };
}
export function parseLogBoxLog(args) {
    const parsed = parseLogBoxLogWeb.parseLogBoxLog(args);
    return {
        ...parsed,
        componentStack: parsed.componentStack.map(convertMetroToComponentFrame),
        componentStackType: 'stack',
    };
}
// TODO(@kitten): Can't be assigned to stack, check this
function convertMetroToComponentFrame(frame) {
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
export function parseComponentStack(message) {
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
export function hasComponentStack(args) {
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
function isComponentStack(consoleArgument) {
    const isOldComponentStackFormat = RE_COMPONENT_STACK_LINE_OLD.test(consoleArgument);
    const isNewComponentStackFormat = RE_COMPONENT_STACK_LINE_NEW.test(consoleArgument);
    const isNewJSCComponentStackFormat = RE_COMPONENT_STACK_LINE_STACK_FRAME.test(consoleArgument);
    return isOldComponentStackFormat || isNewComponentStackFormat || isNewJSCComponentStackFormat;
}
//# sourceMappingURL=parseLogBoxLogNative.js.map