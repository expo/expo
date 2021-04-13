import { getSDKVersionFromRuntimeVersion } from '@expo/sdk-runtime-versions';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { ActivityIndicator, Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { TouchableHighlight, TouchableOpacity } from 'react-native-gesture-handler';
import semver from 'semver';

import ShareProjectButton from '../components/ShareProjectButton';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import { ProjectData, ProjectDataProject } from '../containers/Project';
import { AllStackRoutes } from '../navigation/Navigation.types';
import Environment from '../utils/Environment';
import * as Strings from '../utils/Strings';
import * as UrlUtils from '../utils/UrlUtils';
import * as Icons from './Icons';
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
  if (error && !data?.app.byId) {
    console.log(error);
    contents = (
      <StyledText
        style={SharedStyles.noticeDescriptionText}
        lightColor="rgba(36, 44, 58, 0.7)"
        darkColor="#ccc">
        {ERROR_TEXT}
      </StyledText>
    );
  } else if (loading || !data?.app.byId) {
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
    if (data?.app.byId) {
      const fullName = data?.app.byId.fullName;
      navigation.setOptions({
        title: fullName,
        headerRight: () => <ShareProjectButton fullName={fullName} />,
      });
    }
  }, [navigation, data?.app.byId]);

  return <View style={{ flex: 1 }}>{contents}</View>;
}

function truthy<TValue>(value: TValue | null | undefined): value is TValue {
  return !!value;
}

function getSDKMajorVersionsForLegacyUpdates(app: ProjectDataProject): number[] {
  const majorVersionString = app.sdkVersion ? semver.major(app.sdkVersion) : null;
  return majorVersionString ? [parseInt(majorVersionString, 10)] : [];
}

function getSDKMajorVersionsForEASUpdates(app: ProjectDataProject): number[] {
  const updates = app.updateBranches.map(branch => branch.updates).flat(1);
  if (updates.length === 0) {
    return [];
  }

  return updates
    .map(update => {
      const potentialSDKVersion = getSDKVersionFromRuntimeVersion(update.runtimeVersion);
      const majorVersion = potentialSDKVersion ? semver.major(potentialSDKVersion) : null;
      return majorVersion ? parseInt(majorVersion, 10) : undefined;
    })
    .filter(truthy);
}

function getLatestSDKMajorVersionForApp(app: ProjectDataProject): number | null {
  const sortedVersions = [
    ...getSDKMajorVersionsForLegacyUpdates(app),
    ...getSDKMajorVersionsForEASUpdates(app),
  ].sort((a, b) => b - a);
  return sortedVersions[0] ?? null;
}

function ProjectContents({ app }: { app: ProjectDataProject }) {
  const navigation = useNavigation();

  const isLatestLegacyPublishDeprecated = React.useMemo<boolean>(() => {
    const latestMajorVersion = getLatestSDKMajorVersionForApp(app);
    if (latestMajorVersion !== null) {
      return latestMajorVersion < Environment.lowestSupportedSdkVersion;
    }
    return false;
  }, [app.sdkVersion]);

  const hasEASUpdates = app.updateBranches.some(branch => branch.updates.length > 0);

  return (
    <>
      <ProjectHeader app={app} />
      {isLatestLegacyPublishDeprecated && <ExpoSDKOutdated sdkVersion={app.sdkVersion} />}
      <StartButton
        title="Launch Project"
        disabled={isLatestLegacyPublishDeprecated}
        onPress={() => {
          if (hasEASUpdates) {
            navigation.navigate('ProjectManifestLauncher', {
              legacyManifestFullName: app.fullName,
              branchManifests: app.updateBranches.map(branch => ({
                branchName: branch.name,
                manifestUrl: branch.updates[0].manifestPermalink,
              })),
            });
          } else {
            Linking.openURL(UrlUtils.normalizeUrl(app.fullName!));
          }
        }}
      />
    </>
  );
}

function StartButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  const themeName = theme.dark ? 'dark' : 'light';

  return (
    <TouchableHighlight
      onPress={onPress}
      disabled={disabled}
      style={{
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: disabled ? '#43474A' : Colors[themeName].tintColor,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        flex: 1,
      }}
      underlayColor={disabled ? '#5F6871' : '#81B7E7'}>
      <Text
        style={{
          fontWeight: 'bold',
          color: 'white',
        }}>
        {title}
      </Text>
    </TouchableHighlight>
  );
}

function ExperienceActionItem({
  title,
  children,
  onPress,
}: {
  title: string;
  children?: any;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        justifyContent: 'space-between',
        flex: 1,
        minWidth: '33%',
        alignItems: 'center',
        paddingVertical: 12,
      }}
      disabled={!onPress}
      onPress={onPress}>
      {children}
      <StyledText
        style={{
          opacity: 0.6,
          fontSize: 14,
          textAlign: 'center',
          marginTop: 4,
        }}>
        {title}
      </StyledText>
    </TouchableOpacity>
  );
}

function ProjectHeader(props: { app: ProjectDataProject }) {
  const source = props.app.icon ? props.app.icon.url : props.app.iconUrl;
  const storeUrl = Platform.select({
    android: props.app.playStoreUrl,
    ios: props.app.appStoreUrl,
  });

  const githubUrl = props.app.githubUrl;

  const descriptionComponent = props.app.description ? (
    <StyledText style={styles.descriptionText}>
      {Strings.mutateStringWithLinkComponents(props.app.description)}
    </StyledText>
  ) : null;

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
      <StyledText style={styles.headerFullNameText}>{props.app.name}</StyledText>
      <View style={styles.headerAccountName}>
        <StyledText style={styles.headerAccountText} lightColor="#232B3A" darkColor="#ccc">
          @{props.app.username}
        </StyledText>
      </View>
      {descriptionComponent}
      <View
        style={{
          justifyContent: 'space-around',
          flexDirection: 'row',
          flex: 1,
          height: 72,
          marginTop: 0,
          marginBottom: 12,
          alignItems: 'stretch',
        }}>
        {storeUrl && (
          <ExperienceActionItem
            title="Published"
            onPress={() => {
              // TODO(bacon): app-preview API?
              Linking.openURL(storeUrl!);
            }}>
            <Icons.Store size={28} />
          </ExperienceActionItem>
        )}

        <ExperienceActionItem title="SDK version">
          <StyledText style={{ fontSize: 30, lineHeight: 30 }}>
            {getLatestSDKMajorVersionForApp(props.app)}
          </StyledText>
        </ExperienceActionItem>

        {githubUrl && (
          <ExperienceActionItem
            title="Repo"
            onPress={() => {
              WebBrowser.openBrowserAsync(githubUrl);
            }}>
            <Icons.Github size={30} />
          </ExperienceActionItem>
        )}
      </View>
    </StyledView>
  );
}

function ExpoSDKOutdated(props: { sdkVersion: string }) {
  return (
    <View style={styles.itemMargins}>
      <StyledView
        darkBackgroundColor={Platform.select({
          android: Colors.dark.absolute,
          default: Colors.dark.cardBackground,
        })}
        style={styles.containerShape}>
        <StyledText>
          This project uses SDK{' '}
          <Text style={{ fontWeight: 'bold', color: Colors.light.error }}>v{props.sdkVersion}</Text>
          . Your client supports {Environment.supportedSdksString}. If you want to open this
          project, the you will need to update the project's SDK version.
        </StyledText>
      </StyledView>
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
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  headerAvatarContainer: {
    marginTop: 20,
    marginBottom: 12,
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
  headerAccountName: {
    paddingBottom: 20,
  },
  headerAccountText: {
    fontSize: 14,
  },
  headerFullNameText: {
    fontSize: 20,
    fontWeight: '500',
  },
});
