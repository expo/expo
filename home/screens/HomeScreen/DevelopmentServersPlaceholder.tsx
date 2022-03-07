import { borderRadius, iconSize, QrCodeIcon, spacing } from '@expo/styleguide-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import FeatureFlags from 'FeatureFlags';
import {
  Button,
  ChevronRightIcon,
  Divider,
  Row,
  Spacer,
  Text,
  TextInput,
  useExpoTheme,
  View,
} from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, Platform, Linking } from 'react-native';

import { PressableOpacity } from '../../components/PressableOpacity';
import { ModalStackRoutes } from '../../navigation/Navigation.types';
import {
  alertWithCameraPermissionInstructions,
  requestCameraPermissionsAsync,
} from '../../utils/PermissionUtils';
import * as UrlUtils from '../../utils/UrlUtils';

export function DevelopmentServersPlaceholder() {
  const [showInput, setShowInput] = React.useState(false);
  const [url, setUrl] = React.useState('');

  const theme = useExpoTheme();
  const rotateAnimation = React.useRef(new Animated.Value(0)).current;

  const interpolateRotating = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  React.useEffect(
    function animateChevron() {
      Animated.timing(rotateAnimation, {
        toValue: showInput ? 1 : 0,
        duration: 100,
        useNativeDriver: false,
      }).start(() => {
        rotateAnimation.setValue(showInput ? 1 : 0);
      });
    },
    [showInput]
  );

  function openURL() {
    if (url) {
      const normalizedUrl = UrlUtils.normalizeUrl(url);
      Linking.openURL(normalizedUrl);
    }
  }

  const navigation = useNavigation<NavigationProp<ModalStackRoutes>>();

  const handleQRPressAsync = async () => {
    if (await requestCameraPermissionsAsync()) {
      navigation.navigate('QRCode');
    } else {
      await alertWithCameraPermissionInstructions();
    }
  };

  return (
    <View bg="default" rounded="large">
      <View padding="medium">
        <Text size="small" style={{ marginBottom: spacing[2] }}>
          Start a local development server with:
        </Text>
        <View
          border="default"
          padding="medium"
          rounded="medium"
          bg="secondary"
          style={{ marginBottom: spacing[2] }}>
          <Text size="small" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
            expo start
          </Text>
        </View>
        <Text size="small">Then, select the local server when it appears here.</Text>
      </View>
      {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_CLIPBOARD_BUTTON ? (
        <>
          <Divider />
          <View padding="medium">
            <PressableOpacity onPress={() => setShowInput((prevState) => !prevState)}>
              <Row align="center">
                <Animated.View
                  style={{ transform: [{ rotate: interpolateRotating }], marginRight: spacing[2] }}>
                  <ChevronRightIcon size="small" style={{ tintColor: theme.icon.default }} />
                </Animated.View>
                <Text>Enter URL manually</Text>
              </Row>
            </PressableOpacity>
            {showInput ? <Spacer.Vertical size="medium" /> : null}
            {showInput ? (
              <View>
                <TextInput
                  onChangeText={(newUrl) => setUrl(newUrl.trim())}
                  border="default"
                  rounded="medium"
                  shadow="input"
                  autoCorrect={false}
                  autoComplete="off"
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={openURL}
                  style={{ backgroundColor: theme.background.default }}
                  px="4"
                  py="3"
                  placeholder="exp://"
                  placeholderTextColor={theme.text.secondary}
                />
                <Spacer.Vertical size="small" />
                <PressableOpacity
                  onPress={openURL}
                  disabled={!url}
                  style={[
                    {
                      backgroundColor: theme.button.tertiary.background,
                      padding: spacing[2],
                      borderRadius: borderRadius.medium,
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}>
                  <Button.Text color="tertiary" weight="semibold">
                    Connect
                  </Button.Text>
                </PressableOpacity>
              </View>
            ) : null}
          </View>
        </>
      ) : null}
      {FeatureFlags.ENABLE_PROJECT_TOOLS && FeatureFlags.ENABLE_QR_CODE_BUTTON ? (
        <>
          <Divider />
          <PressableOpacity onPress={handleQRPressAsync}>
            <Row padding="medium" align="center">
              <QrCodeIcon
                size={iconSize.small}
                style={{ marginRight: spacing[2] }}
                color={theme.icon.default}
              />
              <Text>Scan QR code</Text>
            </Row>
          </PressableOpacity>
        </>
      ) : null}
    </View>
  );
}
