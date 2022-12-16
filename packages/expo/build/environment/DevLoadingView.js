import { EventEmitter } from 'expo-modules-core';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Animated, StyleSheet, Text, Platform, View } from 'react-native';
import DevLoadingViewNativeModule from './DevLoadingViewNativeModule';
import { getInitialSafeArea } from './getInitialSafeArea';
export default function DevLoadingView() {
    const [message, setMessage] = useState('Refreshing...');
    const [isDevLoading, setIsDevLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const translateY = useRef(new Animated.Value(0)).current;
    const emitter = useMemo(() => {
        try {
            return new EventEmitter(DevLoadingViewNativeModule);
        }
        catch (error) {
            throw new Error('Failed to instantiate native emitter in `DevLoadingView` because the native module `DevLoadingView` is undefined: ' +
                error.message);
        }
    }, []);
    useEffect(() => {
        if (!emitter)
            return;
        function handleShowMessage(event) {
            setMessage(event.message);
            // TODO: if we show the refreshing banner and don't get a hide message
            // for 3 seconds, warn the user that it's taking a while and suggest
            // they reload
            translateY.setValue(0);
            setIsDevLoading(true);
        }
        function handleHide() {
            // TODO: if we showed the 'refreshing' banner less than 250ms ago, delay
            // switching to the 'finished' banner
            setIsAnimating(true);
            setIsDevLoading(false);
            Animated.timing(translateY, {
                toValue: 150,
                delay: 1000,
                duration: 350,
                useNativeDriver: Platform.OS !== 'web',
            }).start(({ finished }) => {
                if (finished) {
                    setIsAnimating(false);
                    translateY.setValue(0);
                }
            });
        }
        const showMessageSubscription = emitter.addListener('devLoadingView:showMessage', handleShowMessage);
        const hideSubscription = emitter.addListener('devLoadingView:hide', handleHide);
        return function cleanup() {
            showMessageSubscription.remove();
            hideSubscription.remove();
        };
    }, [translateY, emitter]);
    if (!isDevLoading && !isAnimating) {
        return null;
    }
    return (React.createElement(Animated.View, { style: [styles.animatedContainer, { transform: [{ translateY }] }], pointerEvents: "none" },
        React.createElement(View, { style: styles.banner },
            React.createElement(View, { style: styles.contentContainer },
                React.createElement(View, { style: { flexDirection: 'row' } },
                    React.createElement(Text, { style: styles.text }, message)),
                React.createElement(View, { style: { flex: 1 } },
                    React.createElement(Text, { style: styles.subtitle }, isDevLoading ? 'Using Fast Refresh' : "Don't see your changes? Reload the app"))))));
}
const styles = StyleSheet.create({
    animatedContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 42, // arbitrary
    },
    banner: {
        flex: 1,
        overflow: 'visible',
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingBottom: getInitialSafeArea().bottom,
    },
    contentContainer: {
        flex: 1,
        paddingTop: 10,
        paddingBottom: 5,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 15,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.8)',
    },
});
//# sourceMappingURL=DevLoadingView.js.map