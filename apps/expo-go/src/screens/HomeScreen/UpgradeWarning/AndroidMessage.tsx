import { Text } from 'expo-dev-client-components';
import { Linking } from 'react-native';

export function AndroidMessage() {
  return (
    <>
      <Text size="small" type="InterRegular">
        If you have automatic updates enabled for this app, we recommend{' '}
        <Text size="small" type="InterSemiBold">
          disabling
        </Text>{' '}
        it to avoid disruption.
      </Text>
      <Text size="small" type="InterRegular">
        If you ever need to open a project from an earlier SDK version, install the{' '}
        <Text
          size="small"
          type="InterSemiBold"
          color="link"
          onPress={() => Linking.openURL('https://expo.dev/go')}>
          compatible version
        </Text>{' '}
        of Expo Go.
      </Text>
    </>
  );
}
