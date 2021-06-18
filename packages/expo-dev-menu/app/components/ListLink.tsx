import { NavigationContext } from '@react-navigation/native';
import React from 'react';

import ListItemButton from './ListItemButton';

class ListLink extends React.PureComponent<{
  route: string;
  label: string;
  glyphName: string;
}> {
  static contextType = NavigationContext;

  action = () => {
    this.context.navigate(this.props.route);
  };

  render() {
    const { route, label, glyphName } = this.props;
    return <ListItemButton name={route} label={label} onPress={this.action} icon={glyphName} />;
  }
}

export default ListLink;
