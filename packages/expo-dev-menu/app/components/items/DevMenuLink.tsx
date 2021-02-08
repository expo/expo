import React from 'react';

import DevMenuContext from '../../DevMenuContext';
import { DevMenuItemProps, DevMenuItemLinkType } from '../../DevMenuInternal';
import ListLink from '../../components/ListLink';

class DevMenuItemLink extends React.PureComponent<DevMenuItemProps<DevMenuItemLinkType>> {
  static contextType = DevMenuContext;

  render() {
    const { target, label, glyphName } = this.props.item;

    return <ListLink route={target} label={label} glyphName={glyphName} />;
  }
}

export default DevMenuItemLink;
