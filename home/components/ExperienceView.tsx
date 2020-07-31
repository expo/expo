import { A, Code } from '@expo/html-elements';
import { useTheme, useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, StatusBar } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import Environment from '../utils/Environment';
import { getBackgroundColorFromIMGIX } from '../utils/IconColor';
import * as UrlUtils from '../utils/UrlUtils';
import ExperienceHeader from './ExperienceHeader';
import { Experience, Viewer } from './ExperienceView.types';
import { StyledText } from './Text';
import { StyledView } from './Views';
import * as Strings from '../utils/Strings';
import ShareProjectButton from './ShareProjectButton';
import CloseButton from './CloseButton';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';

type Props = {
  experience?: Experience;
  viewer?: Viewer;
};

export default function ExperienceView({ experience }: Props) {
  const theme = useTheme();
  const themeName = theme.dark ? 'dark' : 'light';
  console.log('experience', experience);
  const isDeprecated = React.useMemo<boolean>(() => {
    const majorVersionString = experience?.sdkVersion?.split('.').shift();
    if (majorVersionString) {
      const majorVersion = parseInt(majorVersionString);
      return majorVersion < Environment.lowestSupportedSdkVersion;
    }
    return false;
  }, [experience?.sdkVersion]);

  if (!experience) {
    return (
      <StyledView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </StyledView>
    );
  }

  // NOTE: This can be removed if we decide to go through all projects
  // that are unpublished and delete them in our backend.
  if (!experience.published) {
    return (
      <ScrollView>
        <ExperienceUnpublished />
      </ScrollView>
    );
  }

  const isSupported = !isDeprecated;
  const isSnack = experience.username === 'snack';

  return (
    <BlurView intensity={100} tint={theme.dark ? 'dark' : 'light'} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        {/* <ColorBanner __typename={experience.__typename} icon={experience.icon}> */}
        <ExperienceHeader themeName={themeName} experience={experience} />
        {/* </ColorBanner> */}
        <ExperienceDescription description={experience.description} />
        {!isSupported && (
          <ExpoSDKOutdated fullName={experience.fullName} sdkVersion={experience.sdkVersion} />
        )}
        {isSnack && <ExperienceSnack username={experience.username} slug={experience.slug} />}
        <StartButton isSupported={isSupported} themeName={themeName} onPress={() => {}} />
      </ScrollView>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <CloseButton />
        <ShareProjectButton />
      </View>
    </BlurView>
  );
}

function StartButton({ onPress, isSupported, themeName }) {
  return (
    <TouchableHighlight
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: isSupported ? Colors[themeName].tintColor : '#43474A',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        flex: 1,
      }}
      underlayColor={isSupported ? '#81B7E7' : '#5F6871'}>
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

function ExperienceDescription(props: Pick<Experience, 'description'>) {
  const description: any = React.useMemo(() => {
    if (!props.description) {
      return (
        <>
          This project has no description, the author can add one by updating their{' '}
          <Code
            style={{ backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 4, paddingHorizontal: 1 }}>
            app.config.js
          </Code>{' '}
          in the project's directory.
        </>
      );
    }

    return Strings.mutateStringWithLinkComponents(props.description);
  }, [props.description]);
  return (
    <View style={styles.itemMargins}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 12 }}>
        About this project
      </StyledText>
      <StyledView style={styles.containerShape}>
        <StyledText>{description}</StyledText>
      </StyledView>
    </View>
  );
}

function ExpoSDKOutdated(props: Pick<Experience, 'fullName' | 'sdkVersion'>) {
  return (
    <View style={styles.itemMargins}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 16 }}>
        This project needs an update
      </StyledText>
      <StyledView style={styles.containerShape}>
        <StyledText>
          This project uses SDK{' '}
          <Text style={{ fontWeight: 'bold', color: Colors.light.error }}>v{props.sdkVersion}</Text>
          . Your client supports {Environment.supportedSdksString}. If you want to open this
          project, the author will need to update the project's SDK version. You can still try{' '}
          {props.fullName && (
            <A
              style={{ fontWeight: 'bold', color: Colors.light.error }}
              href={UrlUtils.normalizeUrl(props.fullName)}>
              opening anyways.
            </A>
          )}
        </StyledText>
      </StyledView>
    </View>
  );
}

function ExperienceUnpublished() {
  return (
    <View style={styles.itemMargins}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>
        Project Missing
      </StyledText>
      <StyledView style={styles.containerShape}>
        <StyledText>
          This project is no longer published because the author unpublished it. If you want to open
          this project, the author will need to publish the project's again.
        </StyledText>
      </StyledView>
    </View>
  );
}

function ExperienceSnack(props: Pick<Experience, 'username' | 'slug'>) {
  return (
    <View style={styles.itemMargins}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 16 }}>
        Looking for Snack?
      </StyledText>
      <StyledView style={styles.containerShape}>
        <StyledText>
          Want to see this snack? Click{' '}
          <A href={`https://snack.expo.io/@${props.username}/${props.slug}`}>here</A>.
        </StyledText>
      </StyledView>
    </View>
  );
}

function ColorBanner({
  __typename,
  icon,
  children,
}: Pick<Experience, '__typename' | 'icon'> & { children: any }) {
  const isApp = __typename === 'App';

  const backgroundColor: string = React.useMemo(() => {
    if (isApp) {
      return getBackgroundColorFromIMGIX({ icon }) ?? 'gray';
    }
    return 'gray';
  }, [isApp, icon]);

  return (
    <View style={{ backgroundColor: backgroundColor, justifyContent: 'flex-end' }}>{children}</View>
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
