import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import {
  Image,
  Keyboard,
  Linking,
  Platform,
  Share,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import { StyledText } from '../components/Text';
import { StyledButton } from '../components/Views';
import Colors from '../constants/Colors';
import * as UrlUtils from '../utils/UrlUtils';
import { useSDKExpired } from '../utils/useSDKExpired';
import { Experience } from './ExperienceView.types';

export type PressUsernameHandler = (username: string) => void;

type Props = {
  onPressUsername: PressUsernameHandler;
  style: any;
  description: string;
  iconUrl: string;
  projectUrl: string;
  name: string;
  username: string;
  id: string;
  sdkVersion?: string;
  experienceInfo?: Pick<Experience, 'username' | 'slug'>;
};

export default function ProjectCard({
  onPressUsername,
  style,
  description,
  iconUrl,
  projectUrl,
  name,
  username,
  sdkVersion,
  experienceInfo,
}: Props) {
  const [isExpired, sdkVersionNumber] = useSDKExpired(sdkVersion);

  const navigation = useNavigation();
  const _maybeRenderIcon = () => {
    if (iconUrl) {
      return (
        <View style={styles.iconClipContainer}>
          <FadeIn placeholderColor="#eee">
            <Image source={{ uri: iconUrl }} style={styles.icon} />
          </FadeIn>
        </View>
      );
    }
    return <View style={[styles.icon, { backgroundColor: '#eee' }]} />;
  };

  const _handleLongPressProject = () => {
    if (experienceInfo) {
      navigation.navigate('Experience', experienceInfo);
      return;
    }
    const url = UrlUtils.normalizeUrl(projectUrl);
    Share.share({
      title: name,
      message: url,
      url,
    });
  };

  const _handlePressProject = () => {
    // note(brentvatne): navigation should do this automatically
    Keyboard.dismiss();

    if (isExpired && experienceInfo) {
      navigation.navigate('Experience', experienceInfo);
      return;
    }
    const url = UrlUtils.normalizeUrl(projectUrl);
    Linking.openURL(url);
  };

  const _handlePressUsername = () => {
    // note(brentvatne): navigation should do this automatically
    Keyboard.dismiss();

    if (onPressUsername) {
      onPressUsername(username);
    } else {
      navigation.navigate('Profile', { username });
    }
  };

  return (
    <View style={[styles.spacerContainer, style]}>
      <StyledButton
        onPress={_handlePressProject}
        style={[styles.container]}
        onLongPress={_handleLongPressProject}
        fallback={TouchableHighlight}
        underlayColor="#b7b7b7">
        <View style={[styles.header, { justifyContent: 'space-between' }]}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>{_maybeRenderIcon()}</View>
            <View style={styles.infoContainer}>
              <StyledText style={styles.projectNameText} ellipsizeMode="tail" numberOfLines={1}>
                {name}
              </StyledText>
              <View style={styles.projectExtraInfoContainer}>
                <StyledText
                  lightColor="rgba(36, 44, 58, 0.4)"
                  darkColor="#ccc"
                  onPress={_handlePressUsername}
                  style={styles.projectExtraInfoText}
                  ellipsizeMode="tail"
                  numberOfLines={1}>
                  {username}
                </StyledText>
              </View>
              {sdkVersionNumber && (
                <StyledText
                  lightColor={Colors.light.greyText}
                  darkColor={Colors.dark.greyText}
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                  }}>
                  SDK {sdkVersionNumber || sdkVersion}
                  {isExpired ? ': Not supported' : ''}
                </StyledText>
              )}
            </View>
          </View>
        </View>
        <View style={styles.body}>
          <StyledText
            lightColor="rgba(36, 44, 58, 0.7)"
            darkColor="#eee"
            style={styles.descriptionText}>
            {description}
          </StyledText>
        </View>
      </StyledButton>
    </View>
  );
}

const imageSize = 60;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  spacerContainer: {
    marginBottom: 15,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  expiredIconContainer: {
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    paddingLeft: 15,
    paddingRight: 10,
    paddingBottom: 17,
  },
  iconClipContainer: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  iconContainer: {
    paddingLeft: 15,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  descriptionText: {
    lineHeight: 19,
  },
  icon: {
    width: imageSize,
    height: imageSize,
    borderRadius: 3,
    ...Platform.select({
      android: {
        marginTop: 3,
      },
    }),
  },
  infoContainer: {
    paddingTop: 13,
    flexDirection: 'column',
    alignSelf: 'stretch',
    paddingBottom: 10,
  },
  projectNameText: {
    fontSize: 15,
    marginRight: 170,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },
  projectExtraInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectExtraInfoText: {
    fontSize: 13,
    lineHeight: 16,
  },
});
