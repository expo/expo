import { spacing } from '@expo/styleguide-native';
import { PressableOpacity } from 'components/PressableOpacity';
import dedent from 'dedent';
import { useExpoTheme, Text, Spacer, View } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';

const NO_PUBLISHES_TEXT = dedent`
This project has not yet been published.
`;

export function EmptySection() {
  const theme = useExpoTheme();

  return (
    <View bg="default" border="hairline" rounded="medium" padding="medium" margin="medium">
      <Text color="warning" type="InterRegular">
        {NO_PUBLISHES_TEXT}
      </Text>
      <Spacer.Vertical size="medium" />
      <PressableOpacity
        onPress={() => {
          WebBrowser.openBrowserAsync('https://docs.expo.dev/workflow/publishing/');
        }}
        containerProps={{
          style: {
            padding: spacing[2],
            alignSelf: 'flex-start',
            backgroundColor: theme.button.tertiary.background,
          },
          rounded: 'small',
        }}>
        <Text type="InterSemiBold" style={{ color: theme.button.tertiary.foreground }} size="small">
          Learn more
        </Text>
      </PressableOpacity>
    </View>
  );
}
