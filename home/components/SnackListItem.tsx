import * as React from 'react';
import { Linking, Share } from 'react-native';
import { withNavigation, NavigationInjectedProps } from 'react-navigation';

import UrlUtils from '../utils/UrlUtils';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> &
  NavigationInjectedProps & {
    url: string;
  };

function normalizeDescription(description?: string) {
  return !description || description === 'No description' ? undefined : description;
}

class SnackListItem extends React.PureComponent<Props> {
  render() {
    const { url, subtitle, ...restProps } = this.props;

    return (
      <ListItem
        subtitle={normalizeDescription(subtitle)}
        onPress={this.handlePressProject}
        onLongPress={this.handleLongPressProject}
        {...restProps}
      />
    );
  }

  private handlePressProject = () => {
    const url = UrlUtils.normalizeUrl(this.props.url);
    Linking.openURL(url);
  };

  private handleLongPressProject = () => {
    const url = UrlUtils.normalizeUrl(this.props.url);
    Share.share({
      title: this.props.title,
      message: url,
      url,
    });
  };
}

export default withNavigation(SnackListItem);
