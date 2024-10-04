import { spacing } from '@expo/styleguide-native';
import dedent from 'dedent';
import { useExpoTheme, Text, Spacer, View } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

const NO_PUBLISHES_TEXT = dedent`
This project has not yet been published.
`;

export function EmptySection() {
  const theme = useExpoTheme();

  return (
    <View bg="default" border="default" rounded="medium" padding="medium">
      <Text type="InterRegular">{NO_PUBLISHES_TEXT}</Text>
      <Spacer.Vertical size="medium" />
      <TouchableOpacity
        onPress={() => {
          WebBrowser.openBrowserAsync('https://docs.expo.dev/workflow/publishing/');
        }}
        style={{
          padding: spacing[2],
          alignSelf: 'flex-start',
          backgroundColor: theme.button.ghost.background,
          borderWidth: 1,
          borderColor: theme.button.ghost.border,
          borderRadius: 4,
        }}>
        <Text type="InterSemiBold" style={{ color: theme.button.ghost.foreground }} size="small">
          Learn more
        </Text>
      </TouchableOpacity>
    </View>
  );
}
