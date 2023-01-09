// To improve performance, React Native styles are not well type-checked, but this
// often leads to fatal native crashes (e.g. no indication of what happened).
// To combat this, development-only assertions are added for known style issues.
// - Unsupported web styles, e.g. CSS Grid, CSS Transitions, CSS Animations, CSS Backgrounds, etc.
// - Invalid numeric units, e.g. rem, em, px, cm, mm, in, px, pt, pc, ch, ex, vw, vh, vmin, vmax, etc.
import { Platform } from 'react-native';
import ReactNativeStyleAttributes from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes';
// Prevent errors / warnings by going directly to the source.
// This should be done after React dev tools is setup, otherwise
// the unsupported properties are registered as being valid options.
function setStyleAttributePreprocessor(property, process) {
    // Unlike `StyleSheet.setStyleAttributePreprocessor`, this will prevent warnings from being thrown.
    Object.defineProperty(ReactNativeStyleAttributes, property, {
        get() {
            return {
                process,
            };
        },
    });
}
// Everything here is removed in production bundles.
if (process.env.NODE_ENV === 'development') {
    const PLATFORM_NAME = Platform.select({
        ios: 'iOS',
        android: 'Android',
        default: Platform.OS,
    });
    // Mostly based on react-native-web:
    // https://github.com/necolas/react-native-web/blob/1aa84d54479fb64e77c86d064263144370195f86/packages/react-native-web/src/types/styles.js
    const CSS_GRID = [
        'grid',
        'gridArea',
        'gridAutoColumns',
        'gridAutoFlow',
        'gridAutoRows',
        'gridColumn',
        'gridColumnEnd',
        'gridColumnGap',
        'gridColumnStart',
        'gridRow',
        'gridRowEnd',
        'gridRowGap',
        'gridRowStart',
        'gridTemplateColumns',
        'gridTemplateRows',
        'gridTemplateAreas',
    ];
    const CSS_TRANSITIONS = [
        'transitionDelay',
        'transitionDuration',
        'transitionProperty',
        'transitionTimingFunction',
    ];
    const CSS_ANIMATION = [
        'animationDelay',
        'animationDirection',
        'animationDuration',
        'animationFillMode',
        'animationIterationCount',
        'animationKeyframes',
        'animationName',
        'animationPlayState',
        'animationTimingFunction',
    ];
    const CSS_BACKGROUND = [
        'backgroundAttachment',
        'backgroundBlendMode',
        'backgroundClip',
        'backgroundImage',
        'backgroundOrigin',
        'backgroundPosition',
        'backgroundRepeat',
        'backgroundSize',
    ];
    // This list may need to be updated as the following issue progresses:
    // https://github.com/facebook/react-native/issues/34425/
    // Keep a close eye on the existing list of processors:
    // https://github.com/facebook/react-native/blob/main/Libraries/Components/View/ReactNativeStyleAttributes.js#L21
    const WEB_STYLES = [
        'backdropFilter',
        'boxShadow',
        'boxSizing',
        'clip',
        'cursor',
        'filter',
        'outline',
        'outlineColor',
        'overflowX',
        'overflowY',
        'overscrollBehavior',
        'overscrollBehaviorX',
        'overscrollBehaviorY',
        'perspective',
        'perspectiveOrigin',
        'touchAction',
        'transformOrigin',
        'transformStyle',
        'visibility',
        'willChange',
    ];
    const UNSUPPORTED_STYLES = [
        { props: CSS_GRID, message: 'CSS Grid' },
        { props: CSS_TRANSITIONS, message: 'CSS Transition' },
        { props: CSS_ANIMATION, message: 'CSS Animation' },
        { props: CSS_BACKGROUND, message: 'CSS Background' },
        { props: WEB_STYLES, message: 'CSS Style' },
    ];
    for (const { props, message } of UNSUPPORTED_STYLES) {
        for (const prop of props) {
            if (
            // Allows users to keep custom properties
            !ReactNativeStyleAttributes[prop] ||
                // Allow overwriting the process method if it's `__yoga_assertUnsupportedStyle__`
                ReactNativeStyleAttributes[prop]?.process?.name === '__yoga_assertUnsupportedStyle__') {
                // eslint-disable-next-line no-inner-declarations
                function assertUnsupportedStyle(value) {
                    const errorMessage = [
                        `${message} property "${prop}" is not currently supported on ${PLATFORM_NAME}.`,
                        `style={{ ${prop}: '${value}' }}`,
                        `This is a development error, production use may lead to fatal crashes.`,
                    ];
                    // Use console.error instead of throwing so devs can see more than one issue at a time.
                    console.error(errorMessage.join('\n'));
                    return undefined;
                }
                assertUnsupportedStyle.name = '__yoga_assertUnsupportedStyle__';
                // Prevent errors / warnings by going directly to the source.
                // This should be done after React dev tools is setup, otherwise
                // the unsupported properties are registered as being valid options.
                setStyleAttributePreprocessor(prop, assertUnsupportedStyle);
            }
        }
    }
    // `position: fixed` is extremely common in web development, but it's not supported in React Native.
    // We should ensure developers are warned about this in development mode.
    setStyleAttributePreprocessor('position', (value) => {
        if (['absolute', 'relative', undefined].includes(value)) {
            return value;
        }
        console.error(`CSS Position value "${value}" is not currently supported on ${PLATFORM_NAME}. This is a development error, production use may lead to fatal crashes. From: position: '${value}'`);
        // Pass `relative` to prevent fatal errors from crashing the app
        // before the dev has a chance to see the error.
        return 'relative';
    });
    // A list of existing properties that would commonly be passed a CSS unit.
    // We could parse most numeric values in JS but we should probably avoid that in favor of Yoga native support.
    // List created by copying the existing styles and removing
    // any value that isn't denoted numerically https://github.com/facebook/react-native/blob/main/Libraries/Components/View/ReactNativeStyleAttributes.js#L21
    const NUMERIC_STYLES = [
        'borderBottomWidth',
        'borderEndWidth',
        'borderLeftWidth',
        'borderRightWidth',
        'borderStartWidth',
        'borderTopWidth',
        'columnGap',
        'borderWidth',
        'bottom',
        'end',
        'gap',
        'height',
        'inset',
        'insetBlock',
        'insetBlockEnd',
        'insetBlockStart',
        'insetInline',
        'insetInlineEnd',
        'insetInlineStart',
        'left',
        'margin',
        'marginBlock',
        'marginBlockEnd',
        'marginBlockStart',
        'marginBottom',
        'marginEnd',
        'marginHorizontal',
        'marginInline',
        'marginInlineEnd',
        'marginInlineStart',
        'marginLeft',
        'marginRight',
        'marginStart',
        'marginTop',
        'marginVertical',
        'maxHeight',
        'maxWidth',
        'minHeight',
        'minWidth',
        'padding',
        'paddingBlock',
        'paddingBlockEnd',
        'paddingBlockStart',
        'paddingBottom',
        'paddingEnd',
        'paddingHorizontal',
        'paddingInline',
        'paddingInlineEnd',
        'paddingInlineStart',
        'paddingLeft',
        'paddingRight',
        'paddingStart',
        'paddingTop',
        'paddingVertical',
        'right',
        'rowGap',
        'start',
        'top',
        'width',
        'zIndex',
        'shadowOpacity',
        'borderBottomEndRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius',
        'borderBottomStartRadius',
        'borderEndEndRadius',
        'borderEndStartRadius',
        'borderRadius',
        'borderStartEndRadius',
        'borderStartStartRadius',
        'borderTopEndRadius',
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderTopStartRadius',
        'opacity',
        'fontSize',
        'letterSpacing',
        'lineHeight',
        'textShadowRadius',
    ];
    for (const prop of NUMERIC_STYLES) {
        const processNumericStyle = (value) => {
            if (typeof value === 'string' &&
                // Yoga already supports percentages, but not for all numeric properties.
                !value.endsWith('%')) {
                const [, parsedValue, unit] = value.match(/(\d+)(\w+)?/) ?? [];
                // NOTE(EvanBacon): Maybe we should avoid parsing this as it adds overhead to every numeric property usage.
                if (unit === 'px' || unit === undefined) {
                    // We can provide an easy conversion error for px (`20px`) and stringified (`100`) values.
                    const parsed = parseFloat(parsedValue);
                    console.error(`Convert invalid CSS numeric property usage { ${prop}: "${value}" } to { ${prop}: ${parsed} }. This is a development error, production use may lead to fatal crashes.`);
                    return parsed;
                }
                else {
                    const warning = [
                        `Numeric CSS unit "${unit}" is not supported for property "${prop}" on ${PLATFORM_NAME}.`,
                        `style={{ ${prop}: '${value}' }}`,
                        `This is a development error, production use may lead to fatal crashes.`,
                    ];
                    console.error(warning.join('\n'));
                }
                return undefined;
            }
            return value;
        };
        setStyleAttributePreprocessor(prop, processNumericStyle);
    }
}
//# sourceMappingURL=react-native-styles.fx.native.js.map