import { borderRadius, spacing } from '@expo/styleguide-native';
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
import { Animated, Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import * as UrlUtils from '../../utils/UrlUtils';

export function DevelopmentServersOpenURL() {
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

  return (
    <>
      <Divider style={{ height: 1 }} />
      <View>
        <TouchableOpacity
          style={{ padding: 16 }}
          onPress={() => setShowInput((prevState) => !prevState)}>
          <Row align="center">
            <Animated.View
              style={{ transform: [{ rotate: interpolateRotating }], marginRight: spacing[2] }}>
              <ChevronRightIcon size="small" style={{ tintColor: theme.icon.default }} />
            </Animated.View>
            <Text type="InterRegular">Enter URL manually</Text>
          </Row>
        </TouchableOpacity>
        {showInput && <Spacer.Vertical size="medium" />}
        {showInput && (
          <View padding="medium" style={{ marginTop: -32 }}>
            <TextInput
              onChangeText={(newUrl) => setUrl(newUrl.trim())}
              border="default"
              rounded="medium"
              shadow="input"
              autoCorrect={false}
              autoComplete="off"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={openURL}
              style={{ backgroundColor: theme.background.default }}
              px="4"
              py="3"
              type="InterRegular"
              placeholder="exp://"
              placeholderTextColor={theme.text.secondary}
            />
            <Spacer.Vertical size="small" />
            <TouchableOpacity
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
              <Button.Text color="tertiary" type="InterSemiBold">
                Connect
              </Button.Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}
