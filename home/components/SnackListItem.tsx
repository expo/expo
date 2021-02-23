import * as React from 'react';
import { Linking, Share, View, StyleSheet, Text } from 'react-native';

import Colors from '../constants/Colors';
import * as UrlUtils from '../utils/UrlUtils';
import Badge from './Badge';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> & {
  url: string;
  isDraft?: boolean;
  subtitle?: string;
};

function normalizeDescription(description?: string): string | undefined {
  return !description || description === 'No description' ? undefined : description;
}

function SnackListItem({ url, subtitle, isDraft, ...props }: Props) {
  const handlePressProject = () => {
    Linking.openURL(UrlUtils.normalizeUrl(url));
  };

  const handleLongPressProject = () => {
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: props.title,
      message,
      url: message,
    });
  };

  return (
    <ListItem
      renderExtraText={() => {
        <Text style={styles.extraText} ellipsizeMode="tail" numberOfLines={1}>
          {normalizeDescription(subtitle)}
        </Text>;
      }}
      rightContent={
        isDraft && (
          <View style={styles.rightContentContainer}>
            <Badge text="Draft" />
          </View>
        )
      }
      onPress={handlePressProject}
      onLongPress={handleLongPressProject}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  rightContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginEnd: 10,
    marginStart: 5,
  },
  extraText: {
    color: Colors.light.greyText,
    fontSize: 13,
  },
});

export default SnackListItem;
