import { spacing } from '@expo/styleguide-native';
import { PressableOpacity } from 'components/PressableOpacity';
import dedent from 'dedent';
import { useExpoTheme, Text, Spacer, View } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';

const NO_UPDATES_TEXT = dedent`
This branch has no updates.
`;

export function EmptySection() {
  const theme = useExpoTheme();

  return (
    <View bg="default" border="hairline" rounded="medium" padding="medium">
      <Text type="InterRegular">{NO_UPDATES_TEXT}</Text>
      <Spacer.Vertical size="medium" />
      <PressableOpacity
        onPress={() => {
          WebBrowser.openBrowserAsync(
            'https://docs.expo.dev/eas-update/getting-started/#publish-an-update'
          );
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
