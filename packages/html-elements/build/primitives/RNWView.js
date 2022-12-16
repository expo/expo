/**
 * Copyright (c) Expo.
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as React from 'react';
import StyleSheet from 'react-native-web/dist/exports/StyleSheet';
import TextAncestorContext from 'react-native-web/dist/exports/Text/TextAncestorContext';
import createElement from 'react-native-web/dist/exports/createElement';
import * as forwardedProps from 'react-native-web/dist/modules/forwardedProps';
import pick from 'react-native-web/dist/modules/pick';
import useElementLayout from 'react-native-web/dist/modules/useElementLayout';
import useMergeRefs from 'react-native-web/dist/modules/useMergeRefs';
import usePlatformMethods from 'react-native-web/dist/modules/usePlatformMethods';
import useResponderEvents from 'react-native-web/dist/modules/useResponderEvents';
const forwardPropsList = {
    ...forwardedProps.defaultProps,
    ...forwardedProps.accessibilityProps,
    ...forwardedProps.clickProps,
    ...forwardedProps.focusProps,
    ...forwardedProps.keyboardProps,
    ...forwardedProps.mouseProps,
    ...forwardedProps.touchProps,
    ...forwardedProps.styleProps,
    lang: true,
    onScroll: true,
    onWheel: true,
    pointerEvents: true,
};
const pickProps = (props) => pick(props, forwardPropsList);
/**
 * This is the View from react-native-web copied out in order to supply a custom `__element` property.
 * In the past, you could use `createElement` to create an element with a custom HTML element, but this changed
 * somewhere between 0.14...0.17.
 */
// @ts-ignore
const View = React.forwardRef((props, forwardedRef) => {
    const { onLayout, onMoveShouldSetResponder, onMoveShouldSetResponderCapture, onResponderEnd, onResponderGrant, onResponderMove, onResponderReject, onResponderRelease, onResponderStart, onResponderTerminate, onResponderTerminationRequest, onScrollShouldSetResponder, onScrollShouldSetResponderCapture, onSelectionChangeShouldSetResponder, onSelectionChangeShouldSetResponderCapture, onStartShouldSetResponder, onStartShouldSetResponderCapture, __element, } = props;
    const hasTextAncestor = React.useContext(TextAncestorContext);
    const hostRef = React.useRef(null);
    useElementLayout(hostRef, onLayout);
    useResponderEvents(hostRef, {
        onMoveShouldSetResponder,
        onMoveShouldSetResponderCapture,
        onResponderEnd,
        onResponderGrant,
        onResponderMove,
        onResponderReject,
        onResponderRelease,
        onResponderStart,
        onResponderTerminate,
        onResponderTerminationRequest,
        onScrollShouldSetResponder,
        onScrollShouldSetResponderCapture,
        onSelectionChangeShouldSetResponder,
        onSelectionChangeShouldSetResponderCapture,
        onStartShouldSetResponder,
        onStartShouldSetResponderCapture,
    });
    const style = StyleSheet.compose(hasTextAncestor && styles.inline, 
    // @ts-ignore: untyped
    props.style);
    const supportedProps = pickProps(props);
    supportedProps.style = style;
    const platformMethodsRef = usePlatformMethods(supportedProps);
    const setRef = useMergeRefs(hostRef, platformMethodsRef, forwardedRef);
    supportedProps.ref = setRef;
    return createElement(__element, supportedProps);
});
View.displayName = 'View';
const styles = StyleSheet.create({
    view: {
        alignItems: 'stretch',
        border: '0 solid black',
        boxSizing: 'border-box',
        display: 'flex',
        flexBasis: 'auto',
        flexDirection: 'column',
        flexShrink: 0,
        margin: 0,
        minHeight: 0,
        minWidth: 0,
        padding: 0,
        position: 'relative',
        zIndex: 0,
    },
    inline: {
        display: 'inline-flex',
    },
});
export default View;
//# sourceMappingURL=RNWView.js.map