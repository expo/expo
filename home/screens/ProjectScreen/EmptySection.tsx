import { spacing } from '@expo/styleguide-native';
import dedent from 'dedent';
import { useExpoTheme, Text, Spacer, View } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';

import { PressableOpacity } from '../../components/PressableOpacity';

const NO_PUBLISHES_TEXT = dedent`
This project has not yet been published.
`;

export function EmptySection() {
  const theme = useExpoTheme();

  return (
    <View bg="default" border="hairline" rounded="medium" padding="medium">
      <Text type="InterRegular">{NO_PUBLISHES_TEXT}</Text>
      <Spacer.Vertical size="medium" />
      <PressableOpacity
        onPress={() => {
          WebBrowser.openBrowserAsync('https://docs.expo.dev/workflow/publishing/');
        }}
        containerProps={{
          style: {
            padding: spacing[2],
            alignSelf: 'flex-start',
            backgroundColor: theme.button.ghost.background,
            borderWidth: 1,
            borderColor: theme.button.ghost.border,
          },
          rounded: 'small',
        }}>
        <Text type="InterSemiBold" style={{ color: theme.button.ghost.foreground }} size="small">
          Learn more
        </Text>
      </PressableOpacity>
    </View>
  );
}
