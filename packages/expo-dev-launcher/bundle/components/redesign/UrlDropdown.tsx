import { ChevronDownIcon } from '@expo/styleguide-native';
import { Button, Text, TextInput, Row, Spacer, View } from 'expo-dev-client-components';
import * as React from 'react';
import { TextInput as NativeTextInput } from 'react-native';

import { validateUrl } from '../../functions/validateUrl';
import { useDebounce } from '../../hooks/useDebounce';
import { useExpoTheme } from '../../hooks/useExpoTheme';
import { clientUrlScheme } from '../../native-modules/DevLauncherInternal';

type UrlDropdownProps = {
  onSubmit: (url: string) => void;
};

export function UrlDropdown({ onSubmit }: UrlDropdownProps) {
  const theme = useExpoTheme();
  const ref = React.useRef<NativeTextInput>();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const rotate = open ? '0deg' : '-90deg';
  // slight visual adjustment for centering icon
  const translateX = -3;
  const arrowStyle = { transform: [{ translateX }, { rotate }] };

  const onConnectPress = () => {
    onSubmit(inputValue);
    ref.current.blur();
  };

  const isValidUrl = useDebounce(validateUrl(inputValue), 500);

  return (
    <View>
      <Button padding="medium" onPress={() => setOpen(!open)}>
        <Row align="center">
          <ChevronDownIcon style={arrowStyle} color={theme.icon.default} />
          <Spacer.Horizontal size="tiny" />
          <Text size="large">Enter URL manually</Text>
        </Row>
      </Button>

      {open && (
        <View px="medium" py="medium">
          <View border="default" rounded="medium" padding="medium" shadow="micro">
            <TextInput
              autoFocus
              placeholder={`${clientUrlScheme || 'myapp'}://expo-development-client/...`}
              placeholderTextColor={theme.text.default}
              ref={ref as any}
              value={inputValue}
              onChangeText={setInputValue}
            />
            <View style={{ position: 'absolute', bottom: -20 }}>
              {!isValidUrl && inputValue !== '' && (
                <Text color="error" size="small">
                  Invalid URL
                </Text>
              )}
            </View>
          </View>

          <Spacer.Vertical size="large" />

          <Button
            bg={isValidUrl ? 'tertiary' : 'disabled'}
            shadow="button"
            rounded="medium"
            py="small"
            disabled={!isValidUrl}
            onPress={onConnectPress}>
            <Text align="center" weight="semibold" button="tertiary">
              Connect
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}
