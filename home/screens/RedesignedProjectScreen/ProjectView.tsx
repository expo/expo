import { getSDKVersionFromRuntimeVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import { RedesignedSectionHeader } from '../../components/RedesignedSectionHeader';
import dedent from 'dedent';
import { Row, useExpoTheme, View, Text, Spacer } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text as RNText,
  View as RNView,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import semver from 'semver';

import { Ionicons } from '../../components/Icons';
import ListItem from '../../components/ListItem';
import ScrollView from '../../components/NavigationScrollView';
import SectionHeader from '../../components/SectionHeader';
import ShareProjectButton from '../../components/ShareProjectButton';
import { StyledText } from '../../components/Text';
import { StyledView } from '../../components/Views';
import Colors from '../../constants/Colors';
import SharedStyles from '../../constants/SharedStyles';
import { WebContainerProjectPage_Query } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import Environment from '../../utils/Environment';
import * as UrlUtils from '../../utils/UrlUtils';
import { ProjectHeader } from './ProjectHeader';

const ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

const NO_PUBLISHES_TEXT = dedent`
  This project has not yet been published.
`;

type Props = {
  loading: boolean;
  error?: Error;
  data?: WebContainerProjectPage_Query;
} & StackScreenProps<HomeStackRoutes, 'RedesignedProjectDetails'>;

type ProjectPageApp = WebContainerProjectPage_Query['app']['byId'];
type ProjectUpdateBranch = WebContainerProjectPage_Query['app']['byId']['updateBranches'][0];

export default function ProjectView({ loading, error, data, navigation }: Props) {
  let contents;
  if (error && !data?.app?.byId) {
    console.log(error);
    contents = (
      <StyledText
        style={SharedStyles.noticeDescriptionText}
        lightColor="rgba(36, 44, 58, 0.7)"
        darkColor="#ccc">
        {ERROR_TEXT}
      </StyledText>
    );
  } else if (loading || !data?.app?.byId) {
    contents = (
      <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </RNView>
    );
  } else {
    const app = data.app.byId;

    contents = (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <ProjectHeader app={app} />
        <View padding="medium">
          {(appHasLegacyUpdate(app) || appHasEASUpdates(app)) && (
            <RedesignedSectionHeader header="Launch project" style={{ paddingTop: 0 }} />
          )}
          {appHasLegacyUpdate(app) && <LegacyLaunchSection app={app} />}
          {appHasEASUpdates(app) && <NewLaunchSection app={app} />}
          {!appHasLegacyUpdate(app) && !appHasEASUpdates(app) && <EmptySection />}
        </View>
      </ScrollView>
    );
  }

  React.useEffect(() => {
    if (data?.app?.byId) {
      const fullName = data?.app.byId.fullName;
      const title = data?.app.byId.name ?? fullName;
      navigation.setOptions({
        title,
        headerRight: () => <ShareProjectButton fullName={fullName} />,
      });
    }
  }, [navigation, data?.app?.byId]);

  return <RNView style={{ flex: 1 }}>{contents}</RNView>;
}

function truthy<TValue>(value: TValue | null | undefined): value is TValue {
  return !!value;
}

function getSDKMajorVersionsForLegacyUpdates(app: ProjectPageApp): number | null {
  return app.sdkVersion ? semver.major(app.sdkVersion) : null;
}

function getSDKMajorVersionForEASUpdateBranch(branch: ProjectUpdateBranch): number | null {
  const updates = branch.updates;
  if (updates.length === 0) {
    return null;
  }

  return (
    updates
      .map((update) => {
        const potentialSDKVersion = getSDKVersionFromRuntimeVersion(update.runtimeVersion);
        return potentialSDKVersion ? semver.major(potentialSDKVersion) : null;
      })
      .filter(truthy)
      .sort((a, b) => b - a)[0] ?? null
  );
}

function appHasLegacyUpdate(app: ProjectPageApp): boolean {
  return app.published;
}

function appHasEASUpdates(app: ProjectPageApp): boolean {
  return app.updateBranches.some((branch) => branch.updates.length > 0);
}

function WarningBox({
  title,
  message,
  showLearnMore,
  onLearnMorePress,
}: {
  title: string;
  message: string;
  showLearnMore?: boolean;
  onLearnMorePress?: () => void;
}) {
  const learnMoreButton = showLearnMore ? (
    <StyledText
      onPress={onLearnMorePress}
      style={[styles.warningMessage, styles.warningLearnMoreButton]}>
      Learn more
    </StyledText>
  ) : null;
  return (
    <RNView style={styles.warningContainer}>
      <RNView style={styles.warningHeaderContainer}>
        <Ionicons
          name={Platform.select({ ios: 'ios-warning', default: 'md-warning' })}
          size={18}
          lightColor="#735C0F"
          darkColor="#735C0F"
          style={styles.warningHeaderIcon}
        />
        <StyledText style={styles.warningTitle}>{title}</StyledText>
      </RNView>
      <StyledText style={styles.warningMessage}>{message}</StyledText>
      {learnMoreButton}
    </RNView>
  );
}

function LegacyLaunchSection({ app }: { app: ProjectPageApp }) {
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

  return (
    <RNView>
      <SectionHeader title="Classic release channels" />
      <ListItem
        title="default"
        disabled={warning !== null}
        onPress={() => {
          Linking.openURL(UrlUtils.normalizeUrl(app.fullName));
        }}
        last
      />
      <RNText style={styles.moreLegacyBranchesText}>{moreLegacyBranchesText}</RNText>
      {warning}
    </RNView>
  );
}

function NewLaunchSection({ app }: { app: ProjectPageApp }) {
  const branchesToRender = app.updateBranches.filter(
    (updateBranch) => updateBranch.updates.length > 0
  );

  const branchManifests = branchesToRender.map((branch) => ({
    branchName: branch.name,
    manifestUrl: branch.updates[0].manifestPermalink,
    sdkVersion: getSDKMajorVersionForEASUpdateBranch(branch),
  }));

  const renderBranchManifest = (
    branchManifest: { branchName: string; manifestUrl: string; sdkVersion: number | null },
    index: number
  ) => {
    const isLatestLegacyPublishDeprecated =
      branchManifest.sdkVersion !== null &&
      branchManifest.sdkVersion < Environment.lowestSupportedSdkVersion;

    return (
      <ListItem
        key={`branch-${branchManifest.branchName}`}
        title={branchManifest.branchName}
        onPress={() => {
          if (isLatestLegacyPublishDeprecated) {
            Alert.alert(
              `This branch's SDK version (${branchManifest.sdkVersion}) is no longer supported.`
            );
          } else {
            Linking.openURL(UrlUtils.toExps(branchManifest.manifestUrl));
          }
        }}
        last={index === branchManifests.length - 1}
      />
    );
  };

  return (
    <RNView>
      <SectionHeader title="EAS branches" />
      {branchManifests.map(renderBranchManifest)}
    </RNView>
  );
}

function EmptySection() {
  return (
    <StyledText
      style={[SharedStyles.noticeDescriptionText, styles.emptyInfo]}
      lightColor="rgba(36, 44, 58, 0.7)"
      darkColor="#ccc">
      {NO_PUBLISHES_TEXT}
    </StyledText>
  );
}

const styles = StyleSheet.create({
  containerShape: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  itemMargins: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  descriptionText: {
    marginHorizontal: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarContainer: {
    overflow: 'hidden',
    borderRadius: 5,
  },
  headerAvatar: {
    height: 64,
    width: 64,
    borderRadius: 5,
  },
  legacyHeaderAvatar: {
    backgroundColor: '#eee',
  },
  headerInfoContainer: {
    marginLeft: 15,
  },
  headerAccountText: {
    fontSize: 14,
  },
  headerNameText: {
    fontSize: 20,
    fontWeight: '500',
  },
  moreLegacyBranchesText: {
    fontSize: 12,
    color: Colors.light.greyText,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  warningContainer: {
    borderRadius: 4,
    padding: 16,
    backgroundColor: '#FFFBDD',
    borderColor: '#FFEA7F',
    borderWidth: 1,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  warningHeaderContainer: {
    flexDirection: 'row',
  },
  warningHeaderIcon: {
    marginRight: 4,
  },
  warningTitle: {
    color: '#735C0F',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 22,
  },
  warningMessage: {
    color: '#1B1F23',
    fontSize: 16,
    lineHeight: 24,
  },
  warningLearnMoreButton: {
    textDecorationLine: 'underline',
  },
  emptyInfo: {
    marginTop: 16,
  },
});
