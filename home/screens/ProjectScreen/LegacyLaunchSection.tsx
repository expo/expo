import { iconSize, OpenInternalIcon } from '@expo/styleguide-native';
import { View, Text, Row, useExpoTheme } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Linking, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import semver from 'semver';

import { SectionHeader } from '../../components/SectionHeader';
import { WebContainerProjectPage_Query } from '../../graphql/types';
import Environment from '../../utils/Environment';
import * as UrlUtils from '../../utils/UrlUtils';
import { WarningBox } from './WarningBox';

type ProjectPageApp = WebContainerProjectPage_Query['app']['byId'];

function getSDKMajorVersionsForLegacyUpdates(app: ProjectPageApp): number | null {
  return app.sdkVersion ? semver.major(app.sdkVersion) : null;
}

export function LegacyLaunchSection({ app }: { app: ProjectPageApp }) {
  const legacyUpdatesSDKMajorVersion = getSDKMajorVersionsForLegacyUpdates(app);
  const isLatestLegacyPublishDeprecated =
    legacyUpdatesSDKMajorVersion !== null &&
    legacyUpdatesSDKMajorVersion < Environment.lowestSupportedSdkVersion;
  const doesLatestLegacyPublishHaveRuntimeVersion =
    app.latestReleaseForReleaseChannel?.runtimeVersion !== null;

  const moreLegacyBranchesText =
    Platform.OS === 'ios'
      ? 'To launch from another classic release channel, follow the instructions on the project webpage.'
      : 'To launch from another classic release channel, scan the QR code on the project webpage.';

  let warning: JSX.Element | null = null;
  if (doesLatestLegacyPublishHaveRuntimeVersion) {
    warning = (
      <WarningBox
        message="The latest classic update on the 'default' release channel uses a runtime version that is not compatible with Expo Go. To continue, create a development build."
        showLearnMore
        onLearnMorePress={() => {
          WebBrowser.openBrowserAsync('https://docs.expo.dev/clients/getting-started/');
        }}
      />
    );
  } else if (isLatestLegacyPublishDeprecated) {
    warning = (
      <WarningBox
        message={`The latest classic update on the 'default' release channel uses SDK (${legacyUpdatesSDKMajorVersion}), which is no longer supported.`}
      />
    );
  }

  const theme = useExpoTheme();

  return (
    <View>
      <SectionHeader header="Classic release channels" style={{ paddingTop: 0 }} />
      {warning ?? (
        <View bg="default" overflow="hidden" rounded="large" border="default">
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(UrlUtils.normalizeUrl(app.fullName));
            }}>
            <Row padding="medium" justify="between" align="center" bg="default">
              <Text size="medium" type="InterRegular">
                default
              </Text>
              <OpenInternalIcon color={theme.icon.default} size={iconSize.tiny} />
            </Row>
          </TouchableOpacity>
        </View>
      )}
      <View padding="medium">
        <Text size="small" color="secondary" type="InterRegular">
          {moreLegacyBranchesText}
        </Text>
      </View>
    </View>
  );
}
