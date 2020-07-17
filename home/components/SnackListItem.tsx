import * as React from 'react';
import { Linking, Share } from 'react-native';

import UrlUtils from '../utils/UrlUtils';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> & {
  url: string;
};

function normalizeDescription(description?: string): string | undefined {
  return !description || description === 'No description' ? undefined : description;
}

function SnackListItem({ url, subtitle, ...props }: Props) {
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
      onPress={handlePressProject}
      onLongPress={handleLongPressProject}
      {...props}
    />
  );
}

export default SnackListItem;
