import {
  Button,
  Text,
  TextInput,
  Row,
  Spacer,
  View,
  useExpoTheme,
  ChevronRightIcon,
  useCurrentTheme,
} from 'expo-dev-client-components';
import * as React from 'react';
import {
  ImageStyle,
  TextInput as NativeTextInput,
  Platform,
  StyleProp,
  StyleSheet,
} from 'react-native';

import { ActivityIndicator } from './ActivityIndicator';
import { debounce } from '../functions/debounce';
import { validateUrl } from '../functions/validateUrl';

type UrlDropdownProps = {
  isLoading?: boolean;
  inputValue: string;
  setInputValue: (inputValue: string) => void;
  onSubmit: (url: string) => void;
};

export function UrlDropdown({ onSubmit, isLoading, inputValue, setInputValue }: UrlDropdownProps) {
  const theme = useExpoTheme();
  const currentTheme = useCurrentTheme();

  const buttonColorThemeMap = {
    dark: {
      active: theme.background.secondary,
      inactive: theme.background.default,
    },
    light: {
      active: theme.background.secondary,
      inactive: theme.background.default,
    },
  };

  const ref = React.useRef<NativeTextInput>(null);
  const [open, setOpen] = React.useState(false);
  const [isValidUrl, setIsValidUrl] = React.useState(validateUrl(inputValue));

  const [isPressing, setIsPressing] = React.useState(false);

  const rotate = open ? '90deg' : '0deg';
  // slight visual adjustment for centering icon
  const translateX = -3;
  const arrowStyle: StyleProp<ImageStyle> = { transform: [{ translateX }, { rotate }] };

  const onConnectPress = () => {
    onSubmit(inputValue);
    ref.current?.blur();
  };

  const onTogglePress = () => {
    setOpen(!open);
  };

  const onChangeText = (input: string) => {
    setIsValidUrl(validateUrl(input));
    setInputValue(input);
  };

  const onBlur = () => {
    setIsValidUrl(validateUrl(inputValue));
  };

  const buttonColors = buttonColorThemeMap[currentTheme];
  const backgroundColor = isPressing ? buttonColors.active : buttonColors.inactive;

  return (
    <View rounded="large">
      <Button.Container
        onPressIn={() => setIsPressing(true)}
        onPressOut={() => setIsPressing(false)}
        onPress={onTogglePress}
        roundedTop="none"
        roundedBottom={open ? 'none' : 'large'}
        testID="DevLauncherURLToggle">
        <Row align="center" padding="medium" style={{ backgroundColor }}>
          <View width="6">
            <ChevronRightIcon style={arrowStyle} />
          </View>
          <Text color="default">Enter URL manually</Text>
        </Row>
      </Button.Container>

      {open && (
        <View px="medium" py="medium" roundedBottom="large" bg="default">
          <View
            border="default"
            rounded="medium"
            py={Platform.select({ android: 'tiny', ios: 'medium' })}
            px="medium"
            shadow="micro">
            <TextInput
              autoFocus
              clearButtonMode="while-editing"
              keyboardType="url"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              placeholder="http://10.0.0.25:8081"
              placeholderTextColor={theme.text.secondary}
              ref={ref as any}
              onChangeText={debounce(onChangeText)}
              onBlur={onBlur}
              testID="DevLauncherURLInput"
            />
            <View style={{ position: 'absolute', bottom: -20 }}>
              {!isValidUrl && inputValue !== '' && (
                <Text color="error" size="small">
                  Invalid URL
                </Text>
              )}
            </View>
          </View>

          <Spacer.Vertical size="xl" />

          <Button.FadeOnPressContainer
            bg={isValidUrl ? 'tertiary' : 'disabled'}
            shadow="button"
            rounded="medium"
            disabled={!isValidUrl || isLoading}
            onPress={onConnectPress}
            testID="DevLauncherLoadAppButton">
            <View py="small" opacity={isLoading ? '0.5' : '1'}>
              <Button.Text align="center" weight="semibold" color="tertiary">
                Connect
              </Button.Text>
            </View>
            {isLoading && (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator size="small" />
              </View>
            )}
          </Button.FadeOnPressContainer>
        </View>
      )}
    </View>
  );
}
