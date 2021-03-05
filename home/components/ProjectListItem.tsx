import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';

import Colors from '../constants/Colors';
import * as UrlUtils from '../utils/UrlUtils';
import { useSDKExpired } from '../utils/useSDKExpired';
import Badge from './Badge';
import { Experience } from './ExperienceView.types';
import ListItem from './ListItem';
import { StyledText } from './Text';

type Props = React.ComponentProps<typeof ListItem> & {
  url: string;
  unlisted?: boolean;
  releaseChannel?: string;
  username?: string;
  sdkVersion?: string;
  experienceInfo?: Pick<Experience, 'username' | 'slug'>;
};

function ProjectListItem({
  unlisted,
  username,
  subtitle,
  url,
  releaseChannel,
  sdkVersion,
  ...props
}: Props) {
  const navigation = useNavigation();
  const [isExpired, sdkVersionNumber] = useSDKExpired(sdkVersion);

  const renderRightContent = React.useCallback((): React.ReactNode => {
    return (
      releaseChannel && (
        <View style={styles.rightContentContainer}>
          <Badge text={releaseChannel} />
        </View>
      )
    );
  }, [isExpired, releaseChannel]);

  const handlePress = () => {
    // Open the project info page when it's stale.
    if (isExpired && props.experienceInfo) {
      handleLongPress();
      return;
    }
    Linking.openURL(UrlUtils.normalizeUrl(url));
  };

  const handleLongPress = () => {
    if (props.experienceInfo) {
      navigation.navigate('Experience', props.experienceInfo);
    } else {
      const message = UrlUtils.normalizeUrl(url);
      Share.share({
        title: url,
        message,
        url: message,
      });
    }
  };

  const handlePressUsername = () => {
    navigation.navigate('Profile', { username });
  };

  const renderExtraText = React.useCallback(
    () =>
      sdkVersionNumber ? (
        <StyledText
          lightColor={Colors.light.greyText}
          darkColor={Colors.dark.greyText}
          style={styles.infoText}>
          SDK {sdkVersionNumber}
          {isExpired ? ': Not supported' : ''}
        </StyledText>
      ) : null,
    [sdkVersionNumber, isExpired]
  );

  return (
    <ListItem
      onPress={handlePress}
      onLongPress={handleLongPress}
      rightContent={renderRightContent()}
      {...props}
      imageSize={sdkVersionNumber ? 56 : 40}
      renderExtraText={renderExtraText}
      subtitle={username || subtitle}
      onPressSubtitle={username ? handlePressUsername : undefined}
    />
  );
}

const styles = StyleSheet.create({
  infoText: {
    marginTop: 4,
    fontSize: 12,
  },
  rightContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginEnd: 10,
    marginStart: 5,
  },
});

export default ProjectListItem;
