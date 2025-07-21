import { iconSize, XIcon, InfoIcon, spacing } from '@expo/styleguide-native';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Platform, Linking } from 'react-native';
import Environment from 'src/utils/Environment';

const SDK_VERSION_REGEXP = new RegExp(/\b(\d*)\.0\.0/);

type SdkVersionFromApiType = {
  androidClientUrl?: string;
  androidClientVersion?: string;
  expoVersion?: string;
  facebookReactNativeVersion?: string;
  facebookReactVersion?: string;
  iosClientUrl?: string;
  iosClientVersion?: string;
  releaseNoteUrl?: string;
};

type SdkVersionTypeWithSdkType = SdkVersionFromApiType & {
  sdk: string;
  isLatest?: boolean;
  isBeta?: boolean;
};

type VersionsApiResponseType = {
  sdkVersions: Record<string, SdkVersionFromApiType>;
};

// Show the message if current SDK !== latest SDK AND the latest SDK is yet to be released
async function shouldShowUpgradeWarningAsync(): Promise<{
  shouldShow: boolean;
  betaSdkVersion?: string;
}> {
  const result = await fetch('https://api.expo.dev/v2/versions');

  try {
    const data: VersionsApiResponseType = await result.json();

    const publishedVersions = Object.keys(data.sdkVersions)
      .map((sdk) => ({
        ...data.sdkVersions[sdk],
        sdk: sdk.match(SDK_VERSION_REGEXP)?.[1],
      }))
      .filter((version) => !!version.sdk) as SdkVersionTypeWithSdkType[];

    const lastVersion = publishedVersions[publishedVersions.length - 1];
    const currentIsOutdated = Environment.supportedSdksString !== lastVersion.sdk;
    const latestIsBeta = !lastVersion.releaseNoteUrl;

    return {
      shouldShow: Boolean(currentIsOutdated && latestIsBeta),
      betaSdkVersion: lastVersion.sdk,
    };
  } catch {}

  return {
    shouldShow: false,
  };
}

export function UpgradeWarning() {
  const [shouldShow, setShouldShow] = useState(false);
  const [betaSdkVersion, setBetaSdkVersion] = useState<string | undefined>(undefined);
  const theme = useExpoTheme();
  const dismissUpgradeWarning = () => {
    setShouldShow(false);
  };

  useEffect(() => {
    shouldShowUpgradeWarningAsync().then(({ shouldShow, betaSdkVersion }) => {
      setShouldShow(shouldShow);
      setBetaSdkVersion(betaSdkVersion);
    });
  }, []);

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <View bg="warning" rounded="large" border="warning" overflow="hidden">
        <Pressable onPress={dismissUpgradeWarning} style={styles.dismissButton}>
          <XIcon size={iconSize.regular} color={theme.icon.default} />
        </Pressable>
        <View padding="medium" style={styles.content}>
          <Row style={{ gap: spacing[1] }}>
            <InfoIcon size={iconSize.regular} color={theme.status.warning} />
            <Text type="InterBold" size="small">
              New Expo Go version coming soon!
            </Text>
          </Row>
          <Text size="small" type="InterRegular">
            A new version of Expo Go will be released to the store soon, and it will{' '}
            <Text size="small" type="InterSemiBold">
              only support SDK {betaSdkVersion}
            </Text>
            .
          </Text>
          {Platform.OS === 'ios' ? (
            <>
              <Text size="small" type="InterRegular">
                In order to ensure that you can upgrade at your own pace, we recommend{' '}
                <Text
                  size="small"
                  type="InterSemiBold"
                  color="link"
                  onPress={() =>
                    Linking.openURL(
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
          ) : (
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
          )}
        </View>
      </View>
      <Spacer.Vertical size="medium" />
    </>
  );
}

const styles = StyleSheet.create({
  dismissButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    zIndex: 1,
  },
  content: {
    gap: spacing[1],
  },
});
