import { Text } from 'expo-dev-client-components';
import { openBrowserAsync } from 'expo-web-browser';

export function IosMessage() {
  return (
    <>
      <Text size="small" type="InterRegular">
        In order to ensure that you can upgrade at your own pace, we recommend{' '}
        <Text
          size="small"
          type="InterSemiBold"
          color="link"
          onPress={() =>
            openBrowserAsync(
              'https://docs.expo.dev/develop/development-builds/expo-go-to-dev-build'
            )
          }>
          migrating to a development build
        </Text>
        .
      </Text>
      <Text size="small" type="InterRegular">
        To continue using this version of Expo Go, you can{' '}
        <Text size="small" type="InterSemiBold">
          disable automatic app updates
        </Text>{' '}
        from the App Store settings before the new version is released.
      </Text>
    </>
  );
}
