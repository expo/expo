import { getSDKVersionFromRuntimeVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import semver from 'semver';

import { Ionicons } from '../components/Icons';
import ListItem from '../components/ListItem';
import SectionHeader from '../components/SectionHeader';
import ShareProjectButton from '../components/ShareProjectButton';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import { ProjectData, ProjectDataProject, ProjectUpdateBranch } from '../containers/Project';
import { AllStackRoutes } from '../navigation/Navigation.types';
import Environment from '../utils/Environment';
import * as UrlUtils from '../utils/UrlUtils';
import ScrollView from './NavigationScrollView';
import { StyledText } from './Text';
import { StyledView } from './Views';

const ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

type Props = {
  loading: boolean;
  error?: Error;
  data?: ProjectData;
} & StackScreenProps<AllStackRoutes, 'Project'>;

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  } else {
    contents = (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <ProjectContents app={data.app.byId} />
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

  return <View style={{ flex: 1 }}>{contents}</View>;
}

function truthy<TValue>(value: TValue | null | undefined): value is TValue {
  return !!value;
}

function getSDKMajorVersionsForLegacyUpdates(app: ProjectDataProject): number | null {
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

function appHasLegacyUpdate(app: ProjectDataProject): boolean {
  return app.published;
}

function appHasEASUpdates(app: ProjectDataProject): boolean {
  return app.updateBranches.some((branch) => branch.updates.length > 0);
}

function ProjectContents({ app }: { app: ProjectDataProject }) {
  return (
    <>
      <ProjectHeader app={app} />
      <LegacyLaunchSection app={app} />
      <NewLaunchSection app={app} />
    </>
  );
}

function ProjectHeader(props: { app: ProjectDataProject }) {
  const source = props.app.icon ? props.app.icon.url : props.app.iconUrl;
  return (
    <StyledView style={styles.header} darkBackgroundColor="#000" darkBorderColor="#000">
      <View style={styles.headerAvatarContainer}>
        <FadeIn>
          <Image
            source={source ? { uri: source } : require('../assets/placeholder-app-icon.png')}
            style={{
              width: 64,
              height: 64,
            }}
          />
        </FadeIn>
      </View>
      <View style={styles.headerInfoContainer}>
        <StyledText style={styles.headerNameText}>{props.app.name}</StyledText>
        <StyledText style={styles.headerAccountText} lightColor="#232B3A" darkColor="#ccc">
          @{props.app.username}
        </StyledText>
      </View>
    </StyledView>
  );
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
    <View style={styles.warningContainer}>
      <View style={styles.warningHeaderContainer}>
        <Ionicons
          name={Platform.select({ ios: 'ios-warning', default: 'md-warning' })}
          size={18}
          lightColor="#735C0F"
          darkColor="#735C0F"
          style={styles.warningHeaderIcon}
        />
        <StyledText style={styles.warningTitle}>{title}</StyledText>
      </View>
      <StyledText style={styles.warningMessage}>{message}</StyledText>
      {learnMoreButton}
    </View>
  );
}

function LegacyLaunchSection({ app }: { app: ProjectDataProject }) {
  if (!appHasLegacyUpdate(app)) {
    return null;
  }

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
    <View>
      <SectionHeader title="Classic release channels" />
      <ListItem
        title="default"
        disabled={warning !== null}
        onPress={() => {
          Linking.openURL(UrlUtils.normalizeUrl(app.fullName));
        }}
        last
      />
      <Text style={styles.moreLegacyBranchesText}>{moreLegacyBranchesText}</Text>
      {warning}
    </View>
  );
}

function NewLaunchSection({ app }: { app: ProjectDataProject }) {
  if (!appHasEASUpdates(app)) {
    return null;
  }

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
    <View>
      <SectionHeader title="EAS branches" />
      {branchManifests.map(renderBranchManifest)}
    </View>
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
    marginTop: -1,
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
});
