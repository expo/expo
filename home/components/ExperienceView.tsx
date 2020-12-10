import { A } from '@expo/html-elements';
import { useNavigation, useTheme } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { ScrollView, TouchableHighlight, TouchableOpacity } from 'react-native-gesture-handler';
import semver from 'semver';

import Colors from '../constants/Colors';
import Environment from '../utils/Environment';
import * as Strings from '../utils/Strings';
import * as UrlUtils from '../utils/UrlUtils';
import CloseButton from './CloseButton';
import { Experience, Viewer } from './ExperienceView.types';
import * as Icons from './Icons';
import ShareProjectButton from './ShareProjectButton';
import { StyledText } from './Text';
import { StyledBlurView, StyledView } from './Views';

type Props = {
  experience?: Experience;
  viewer?: Viewer;
};

export default function ExperienceView({ experience }: Props) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <StyledBlurView style={{ flex: 1 }}>
        {experience ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 48 }}>
            <ExperienceContents experience={experience} />
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
        <ModalHeader />
      </StyledBlurView>
    </>
  );
}

function ExperienceContents({ experience }: { experience: Experience }) {
  const isDeprecated = React.useMemo<boolean>(() => {
    const majorVersionString = experience?.sdkVersion?.split('.').shift();
    if (majorVersionString) {
      const majorVersion = parseInt(majorVersionString, 10);
      return majorVersion < Environment.lowestSupportedSdkVersion;
    }
    return false;
  }, [experience?.sdkVersion]);

  // NOTE: This can be removed if we decide to go through all projects
  // that are unpublished and delete them in our backend.
  if (!experience.published) {
    return <ExperienceUnpublished />;
  }

  const isSnack = experience.username === 'snack';

  return (
    <>
      <ExperienceHeader {...experience} />

      <ExperienceActions {...experience} />
      <ExperienceDescription description={experience.description} />
      {isDeprecated && <ExpoSDKOutdated sdkVersion={experience.sdkVersion} />}
      {isSnack && <ExperienceSnack username={experience.username} slug={experience.slug} />}
      <StartButton
        isDeprecated={isDeprecated}
        onPress={() => {
          Linking.openURL(UrlUtils.normalizeUrl(experience.fullName!));
        }}
      />
    </>
  );
}

function ModalHeader() {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: Platform.select({ android: 12, default: 3 }),
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
      <CloseButton />
      <ShareProjectButton />
    </View>
  );
}

function StartButton({ onPress, isDeprecated }: { onPress: () => void; isDeprecated?: boolean }) {
  const theme = useTheme();
  const themeName = theme.dark ? 'dark' : 'light';

  return (
    <TouchableHighlight
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: isDeprecated ? '#43474A' : Colors[themeName].tintColor,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        flex: 1,
      }}
      underlayColor={isDeprecated ? '#5F6871' : '#81B7E7'}>
      <Text
        style={{
          fontWeight: 'bold',
          color: 'white',
        }}>
        Open Project
      </Text>
    </TouchableHighlight>
  );
}

// Actions

function ExperienceActions(
  props: Pick<Experience, 'sdkVersion' | 'githubUrl' | 'appStoreUrl' | 'playStoreUrl'>
) {
  const storeUrl = Platform.select({
    android: props.playStoreUrl,
    ios: props.appStoreUrl,
  });
  return (
    <View
      style={{
        justifyContent: 'space-around',
        flexDirection: 'row',
        flex: 1,
        height: 72,
        marginTop: 0,
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
          {semver.major(props.sdkVersion)}
        </StyledText>
      </ExperienceActionItem>

      {props.githubUrl && (
        <ExperienceActionItem
          title="Repo"
          onPress={() => {
            const githubUrl = props.githubUrl!;
            WebBrowser.openBrowserAsync(githubUrl);
          }}>
          <Icons.Github size={30} />
        </ExperienceActionItem>
      )}
    </View>
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

// Header

function ExperienceHeader(
  props: Pick<Experience, 'fullName' | 'icon' | 'iconUrl' | 'privacy' | 'name' | 'username'>
) {
  const navigation = useNavigation();

  const onPress = () => {
    Linking.openURL(UrlUtils.normalizeUrl(props.fullName!));
  };

  const onPressUsername = () => {
    navigation.goBack();
    navigation.navigate('Profile', { username: props.username });
  };

  return (
    <View
      style={{
        marginTop: 48,
        width: '100%',
        alignItems: 'center',
      }}>
      <ExperienceIcon
        source={props.icon ? props.icon.url : props.iconUrl}
        size={120}
        onPress={onPress}
      />
      <StyledText
        style={{
          marginTop: 24,
          fontWeight: 'bold',
          fontSize: 30,
          marginBottom: 4,
        }}>
        {props.name}
      </StyledText>
      <StyledText onPress={onPressUsername} style={{ fontSize: 16, opacity: 0.6 }}>
        By {props.username}
      </StyledText>
    </View>
  );
}

function ExperienceIcon({ source, size, onPress }: any) {
  return (
    <TouchableOpacity
      style={{
        borderRadius: 12,
        overflow: 'hidden',
      }}
      onPress={onPress}>
      <FadeIn placeholderColor="#eee">
        <>
          <Image
            source={source ? { uri: source } : require('../assets/placeholder-app-icon.png')}
            style={{
              width: size,
              height: size,
            }}
          />
        </>
      </FadeIn>
    </TouchableOpacity>
  );
}

// Sections

function SectionHeader({ children }: { children: string }) {
  return (
    <StyledText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>
      {children}
    </StyledText>
  );
}

function SectionView(props: React.ComponentProps<typeof StyledView> & { children?: any }) {
  return (
    <StyledView
      darkBackgroundColor={Platform.select({
        android: Colors.dark.absolute,
        default: Colors.dark.cardBackground,
      })}
      {...props}
    />
  );
}

function ExperienceDescription(props: Pick<Experience, 'description'>) {
  const description: any = React.useMemo(() => {
    if (!props.description) {
      return (
        <>
          This project has no description, the author can add one by updating their{' '}
          <Text
            style={{
              fontWeight: 'bold',
            }}>
            app.json
          </Text>{' '}
          in the project's directory.
        </>
      );
    }

    return Strings.mutateStringWithLinkComponents(props.description);
  }, [props.description]);
  return (
    <View style={styles.itemMargins}>
      <SectionHeader>About this project</SectionHeader>
      <SectionView style={styles.containerShape}>
        <StyledText>{description}</StyledText>
      </SectionView>
    </View>
  );
}

function ExpoSDKOutdated(props: Pick<Experience, 'sdkVersion'>) {
  return (
    <View style={styles.itemMargins}>
      <SectionHeader>This project needs an update</SectionHeader>
      <SectionView style={styles.containerShape}>
        <StyledText>
          This project uses SDK{' '}
          <Text style={{ fontWeight: 'bold', color: Colors.light.error }}>v{props.sdkVersion}</Text>
          . Your client supports {Environment.supportedSdksString}. If you want to open this
          project, the author will need to update the project's SDK version.
        </StyledText>
      </SectionView>
    </View>
  );
}

function ExperienceUnpublished() {
  return (
    <View style={styles.itemMargins}>
      <SectionHeader>Project Missing</SectionHeader>
      <SectionView style={styles.containerShape}>
        <StyledText>
          This project is no longer published because the author unpublished it. If you want to open
          this project, the author will need to publish the project's again.
        </StyledText>
      </SectionView>
    </View>
  );
}

function ExperienceSnack(props: Pick<Experience, 'username' | 'slug'>) {
  return (
    <View style={styles.itemMargins}>
      <SectionHeader>Looking for Snack?</SectionHeader>
      <SectionView style={styles.containerShape}>
        <StyledText>
          Want to see this snack? Click{' '}
          <A href={`https://snack.expo.io/@${props.username}/${props.slug}`}>here</A>.
        </StyledText>
      </SectionView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    maxWidth: 1248,
    paddingHorizontal: 24,

    width: '100%',
    marginHorizontal: 'auto',
    marginBottom: 100,
  },
  container: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
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
});
