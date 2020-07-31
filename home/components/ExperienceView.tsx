import { A, Code } from '@expo/html-elements';
import { useTheme, useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '../constants/Colors';
import Environment from '../utils/Environment';
import { getBackgroundColorFromIMGIX } from '../utils/IconColor';
import * as UrlUtils from '../utils/UrlUtils';
import ExperienceHeader from './ExperienceHeader';
import { Experience, Viewer } from './ExperienceView.types';
import { StyledText } from './Text';
import { StyledView } from './Views';
import * as Strings from '../utils/Strings';

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
    <ScrollView style={{ flex: 1, backgroundColor: Colors[themeName].bodyBackground }}>
      <ColorBanner __typename={experience.__typename} icon={experience.icon}>
        <ExperienceHeader themeName={themeName} experience={experience} />
      </ColorBanner>
      <ExperienceDescription description={experience.description} />
      {!isSupported && (
        <ExpoSDKOutdated fullName={experience.fullName} sdkVersion={experience.sdkVersion} />
      )}
      {isSnack && <ExperienceSnack username={experience.username} slug={experience.slug} />}
    </ScrollView>
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
    <StyledView style={styles.container}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
        About this project
      </StyledText>
      <StyledText>{description}</StyledText>
    </StyledView>
  );
}

function ExpoSDKOutdated(props: Pick<Experience, 'fullName' | 'sdkVersion'>) {
  return (
    <StyledView style={styles.container}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>
        This project needs an update
      </StyledText>
      <StyledText>
        This project uses SDK{' '}
        <Text style={{ fontWeight: 'bold', color: Colors.light.error }}>v{props.sdkVersion}</Text>.
        Your client supports {Environment.supportedSdksString}. If you want to open this project,
        the author will need to update the project's SDK version. You can still try{' '}
        {props.fullName && (
          <A
            style={{ fontWeight: 'bold', color: Colors.light.error }}
            href={UrlUtils.normalizeUrl(props.fullName)}>
            opening anyways.
          </A>
        )}
      </StyledText>
    </StyledView>
  );
}

function ExperienceUnpublished() {
  return (
    <StyledView style={styles.container}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>
        Project Missing
      </StyledText>
      <StyledText>
        This project is no longer published because the author unpublished it. If you want to open
        this project, the author will need to publish the project's again.
      </StyledText>
    </StyledView>
  );
}

function ExperienceSnack(props: Pick<Experience, 'username' | 'slug'>) {
  return (
    <StyledView style={styles.container}>
      <StyledText style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>
        Looking for Snack?
      </StyledText>
      <StyledText>
        Want to see this snack? Click{' '}
        <A href={`https://snack.expo.io/@${props.username}/${props.slug}`}>here</A>.
      </StyledText>
    </StyledView>
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
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
});
