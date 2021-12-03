import {
  View,
  Heading,
  Text,
  Row,
  XIcon,
  Spacer,
  Button,
  StatusIndicator,
  ChevronRightIcon,
  Divider,
} from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet, useWindowDimensions, Animated } from 'react-native';

import { Packager } from '../../functions/getLocalPackagersAsync';
import { useLocalPackagers } from '../../hooks/useLocalPackagers';
import { usePendingDeepLink } from '../../hooks/usePendingDeepLink';
import {
  addDeepLinkListener,
  getPendingDeepLink,
  loadApp,
} from '../../native-modules/DevLauncherInternal';

type PendingDeepLinkPromptProps = object;

export function PendingDeepLinkPrompt({}: PendingDeepLinkPromptProps) {
  const [animating, setAnimating] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(0));

  const { height: screenHeight } = useWindowDimensions();
  const { data: packagers = [] } = useLocalPackagers();
  const { pendingDeepLink, setPendingDeepLink } = usePendingDeepLink();

  const toggleModal = React.useCallback((isVisible: boolean) => {
    setAnimating(true);
    setIsVisible(isVisible);

    Animated.timing(animatedValue.current, {
      toValue: isVisible ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setAnimating(false);
    });
  }, []);

  React.useEffect(() => {
    getPendingDeepLink().then((url) => {
      if (url) {
        setPendingDeepLink(url);
        toggleModal(true);
      }
    });
  }, []);

  React.useEffect(() => {
    const listener = addDeepLinkListener((url) => {
      if (url) {
        setPendingDeepLink(url);
        toggleModal(true);
      }
    });

    return () => {
      listener.remove();
    };
  }, [toggleModal]);

  const onClosePress = () => {
    toggleModal(false);
  };

  const onPackagerPress = async (packager: Packager) => {
    await loadApp(packager.url);
  };

  const translateY = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  const transform = [
    {
      translateY,
    },
  ];

  const opacity = animatedValue.current.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const shouldBeVisible = animating || isVisible;

  if (!shouldBeVisible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={pendingDeepLink ? 'auto' : 'none'}>
      <Button style={StyleSheet.absoluteFill} onPress={onClosePress}>
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0, 0.8)', opacity }]}>
          <Animated.View
            accessibilityRole="alert"
            accessibilityViewIsModal
            style={[
              StyleSheet.absoluteFillObject,
              { transform, opacity, justifyContent: 'center' },
            ]}>
            <View padding="large">
              <View py="large" rounded="large" bg="default" shadow="small">
                <Row px="large">
                  <Heading size="small">Deep link received:</Heading>
                  <Spacer.Horizontal size="flex" />
                  <Button onPress={onClosePress} accessibilityHint="Close modal">
                    <XIcon />
                  </Button>
                </Row>

                <Spacer.Vertical size="small" />
                <View py="small" bg="secondary" rounded="medium" px="medium" mx="small">
                  <Text type="mono">{pendingDeepLink}</Text>
                </View>

                <Spacer.Vertical size="large" />

                <View px="large">
                  <Text size="large">Select an app to open it:</Text>

                  <Spacer.Vertical size="medium" />
                  <View>
                    {packagers.map((packager, index, arr) => {
                      const isLastItem = index === arr.length - 1;

                      return (
                        <View key={packager.description} rounded="medium">
                          <Button onPress={() => onPackagerPress(packager)}>
                            <Row align="center" py="medium" px="small">
                              <StatusIndicator size="small" status="success" />
                              <Spacer.Horizontal size="small" />
                              <Text>{packager.description}</Text>
                              <Spacer.Horizontal size="flex" />
                              <ChevronRightIcon />
                            </Row>
                          </Button>
                          {!isLastItem && <Divider />}
                        </View>
                      );
                    })}
                  </View>

                  <Spacer.Vertical size="large" />

                  <Button
                    bg="tertiary"
                    rounded="medium"
                    py="small"
                    px="medium"
                    onPress={onClosePress}>
                    <Text size="large" align="center" weight="semibold" button="tertiary">
                      Open somewhere else
                    </Text>
                  </Button>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Button>
    </View>
  );
}
