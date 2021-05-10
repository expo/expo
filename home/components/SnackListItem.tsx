import * as React from 'react';
import { Linking, Share, View, StyleSheet } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';
import Badge from './Badge';
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
});

export default SnackListItem;
