import { iconSize, OpenInternalIcon, spacing } from '@expo/styleguide-native';
import { View, Text, Spacer, Row, useExpoTheme } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Linking, Platform } from 'react-native';
import semver from 'semver';

import { PressableOpacity } from '../../components/PressableOpacity';
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
        title="Incompatible update"
        message="The latest update uses a runtime version that is not compatible with Expo Go. To continue, create a custom dev client."
        showLearnMore
        onLearnMorePress={() => {
          WebBrowser.openBrowserAsync('https://docs.expo.dev/clients/getting-started/');
        }}
      />
    );
  } else if (isLatestLegacyPublishDeprecated) {
    warning = (
      <WarningBox
        title="Unsupported SDK version"
        message={`This project's SDK version (${legacyUpdatesSDKMajorVersion}) is no longer supported.`}
        showLearnMore={false}
      />
    );
  }

  const theme = useExpoTheme();

  return (
    <View>
      <View bg="default" overflow="hidden" rounded="large" border="hairline">
        <PressableOpacity
          onPress={() => {
            Linking.openURL(UrlUtils.normalizeUrl(app.fullName));
          }}
          containerProps={{ bg: 'default' }}>
          <Row padding="medium" justify="between" align="center">
            <Text size="medium" type="InterRegular">
              Use Classic Updates
            </Text>
            <OpenInternalIcon color={theme.icon.default} size={iconSize.tiny} />
          </Row>
        </PressableOpacity>
      </View>
      <Spacer.Vertical size="small" />
      <Text size="small" type="InterRegular" style={{ marginHorizontal: spacing[4] }}>
        {moreLegacyBranchesText}
      </Text>
      <Spacer.Vertical size="medium" />
      {warning}
    </View>
  );
}
