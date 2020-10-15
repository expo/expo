import * as React from 'react';
import { Linking, Share, View, Text, StyleSheet } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> & {
  url: string;
  isDraft?: boolean;
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
      subtitle={normalizeDescription(subtitle)}
      rightContent={
        isDraft ? (
          <View style={styles.rightContentContainer}>
            <View style={styles.draftContainer}>
              <Text style={styles.draftText} numberOfLines={1} ellipsizeMode="tail">
                Draft
              </Text>
            </View>
          </View>
        ) : (
          undefined
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
  },
  draftContainer: {
    marginEnd: 10,
    marginStart: 5,
    backgroundColor: 'rgba(0,0,0,0.025)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftText: {
    color: '#888',
    fontSize: 11,
  },
});

export default SnackListItem;
