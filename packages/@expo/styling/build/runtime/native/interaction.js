import React from 'react';
import { createSignal } from './signals';
export function useInteractionSignals() {
    return React.useMemo(() => ({
        active: createSignal(false),
        hover: createSignal(false),
        focus: createSignal(false),
        layout: {
            width: createSignal(0),
            height: createSignal(0),
        },
    }), []);
}
export function useInteractionHandlers(props, signals, meta) {
    const propsRef = React.useRef(props);
    propsRef.current = props;
    /**
     * Does setting a handler for each interaction cause any performance issues?
     * Would it be better to check the conditions on each style and selectively add them?
     *
     * onLayout is only used when there is a containerName, we can easily make that optional
     */
    const memoHandlers = React.useMemo(() => ({
        // You need onPress for onPressIn and onPressOut to work?
        onPress(event) {
            propsRef.current.onPress?.(event);
        },
        onPressIn(event) {
            propsRef.current.onPressIn?.(event);
            signals.active.set(true);
        },
        onPressOut(event) {
            propsRef.current.onPressOut?.(event);
            signals.active.set(false);
        },
        onHoverIn(event) {
            propsRef.current.onHoverIn?.(event);
            signals.hover.set(true);
        },
        onHoverOut(event) {
            propsRef.current.onHoverIn?.(event);
            signals.hover.set(false);
        },
        onFocus(event) {
            propsRef.current.onFocus?.(event);
            signals.focus.set(true);
        },
        onBlur(event) {
            propsRef.current.onBlur?.(event);
            signals.focus.set(false);
        },
        onLayout(event) {
            propsRef.current.onLayout?.(event);
            signals.layout.width.set(event.nativeEvent.layout.width);
            signals.layout.height.set(event.nativeEvent.layout.height);
        },
    }), []);
    const handlers = {};
    if (meta.requiresLayout)
        handlers.onLayout = memoHandlers.onLayout;
    if (meta.hasActive) {
        handlers.onPress = memoHandlers.onPress;
        handlers.onPressIn = memoHandlers.onPressIn;
        handlers.onPressOut = memoHandlers.onPressOut;
    }
    if (meta.hasHover) {
        handlers.onHoverIn = memoHandlers.onHoverIn;
        handlers.onHoverOut = memoHandlers.onHoverOut;
    }
    if (meta.hasFocus) {
        handlers.onFocus = memoHandlers.onFocus;
        handlers.onBlur = memoHandlers.onBlur;
    }
    return handlers;
}
//# sourceMappingURL=interaction.js.map