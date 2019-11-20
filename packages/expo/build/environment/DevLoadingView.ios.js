import React, { useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, SafeAreaView, Text, NativeModules, NativeEventEmitter, View, } from 'react-native';
const NativeDevLoadingView = NativeModules.DevLoadingView;
const nativeDevLoadingViewEventEmitter = new NativeEventEmitter(NativeDevLoadingView);
export default function DevLoadingView() {
    let [isDevLoading, setIsDevLoading] = useState(false);
    let [isAnimating, setIsAnimating] = useState(false);
    let translateY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        function handleShowMessage({ message }) {
            // "Refreshing..." is the standard fast refresh message and it's the
            // only time we want to display this overlay.
            if (message !== 'Refreshing...') {
                return;
            }
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
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setIsAnimating(false);
                    translateY.setValue(0);
                }
            });
        }
        nativeDevLoadingViewEventEmitter.addListener('devLoadingView:showMessage', handleShowMessage);
        nativeDevLoadingViewEventEmitter.addListener('devLoadingView:hide', handleHide);
        return function cleanup() {
            nativeDevLoadingViewEventEmitter.removeListener('devLoadingView:showMessage', handleShowMessage);
            nativeDevLoadingViewEventEmitter.removeListener('devLoadingView:hide', handleHide);
        };
    }, []);
    if (isDevLoading || isAnimating) {
        return (<Animated.View style={[styles.animatedContainer, { transform: [{ translateY }] }]} pointerEvents="none">
        <SafeAreaView style={styles.banner}>
          <View style={styles.contentContainer}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={styles.text}>{isDevLoading ? 'Refreshing...' : 'Refreshed'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subtitle}>
                {isDevLoading ? 'Using Fast Refresh' : "Don't see your changes? Reload the app"}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>);
    }
    else {
        return null;
    }
}
const styles = StyleSheet.create({
    animatedContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 42,
    },
    banner: {
        flex: 1,
        overflow: 'visible',
        backgroundColor: 'rgba(0,0,0,0.75)',
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
//# sourceMappingURL=DevLoadingView.ios.js.map