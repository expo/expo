import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  SafeAreaView,
  Text,
  NativeModules,
  NativeEventEmitter,
  View,
} from 'react-native';

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

      // TODO: maybe we want to add a timeout here, so if it takes more than a
      // couple seconds we ask the developer if they want to try a full reload?

      setIsDevLoading(true);
      translateY.setValue(0);
    }

    function handleHide() {
      setIsAnimating(true);
      setIsDevLoading(false);
      Animated.timing(translateY, {
        toValue: -100,
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
      nativeDevLoadingViewEventEmitter.removeListener(
        'devLoadingView:showMessage',
        handleShowMessage
      );
      nativeDevLoadingViewEventEmitter.removeListener('devLoadingView:hide', handleHide);
    };
  });

  if (isDevLoading || isAnimating) {
    return (
      <Animated.View style={[styles.animatedContainer, { transform: [{ translateY }] }]}>
        <SafeAreaView style={styles.banner}>
          <View style={styles.contentContainer}>
            <View style={{flexDirection: 'row'}}>
              <Text style={styles.text}>
                {isDevLoading ? 'Refreshing...' : 'Refreshed'}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.subtitle}>
                {isDevLoading ? 'Using Fast Refresh' : "Don't see your changes? Reload the app"}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  } else {
    return null;
  }
}

const styles = StyleSheet.create({
  animatedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  banner: {
    flex: 1,
    overflow: 'visible',
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 5,
    paddingBottom: 10,
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
