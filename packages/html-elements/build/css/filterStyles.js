import { StyleSheet } from 'react-native';
// Remove the unsupported web styles from the style object
// to prevent crashing.
const WEB_STYLES = [
    'backdropFilter',
    'animationDelay',
    'animationDirection',
    'animationDuration',
    'animationFillMode',
    'animationName',
    'animationIterationCount',
    'animationPlayState',
    'animationTimingFunction',
    'backgroundAttachment',
    'backgroundBlendMode',
    'backgroundClip',
    'backgroundImage',
    'backgroundOrigin',
    'backgroundPosition',
    'backgroundRepeat',
    'backgroundSize',
    'boxShadow',
    'boxSizing',
    'clip',
    'cursor',
    'filter',
    'gridAutoColumns',
    'gridAutoFlow',
    'gridAutoRows',
    'gridColumnEnd',
    'gridColumnGap',
    'gridColumnStart',
    'gridRowEnd',
    'gridRowGap',
    'gridRowStart',
    'gridTemplateColumns',
    'gridTemplateRows',
    'gridTemplateAreas',
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
    'transitionDelay',
    'transitionDuration',
    'transitionProperty',
    'transitionTimingFunction',
    'userSelect',
    'willChange',
];
export function filterStyles(styleProp) {
    if (!styleProp) {
        return styleProp;
    }
    const style = StyleSheet.flatten(styleProp);
    const filteredStyle = Object.fromEntries(Object.entries(style).filter(([k]) => !WEB_STYLES.includes(k)));
    return processNativeStyles(filteredStyle);
}
function processNativeStyles(style) {
    if (!style)
        return style;
    if (style.visibility) {
        if (style.visibility === 'hidden') {
            // style.display = "none";
            style.opacity = 0;
        }
        delete style.visibility;
    }
    if (style.position) {
        if (!['absolute', 'relative'].includes(style.position)) {
            console.warn(`Unsupported position: '${style.position}'`);
            style.position = 'relative';
        }
    }
    return style;
}
//# sourceMappingURL=filterStyles.js.map