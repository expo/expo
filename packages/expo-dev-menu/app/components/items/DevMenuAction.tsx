import React from 'react';

import DevMenuContext from '../../DevMenuContext';
import {
  DevMenuItemProps,
  DevMenuItemActionType,
  dispatchActionAsync,
} from '../../DevMenuInternal';
import ListItemButton from '../../components/ListItemButton';

class DevMenuItemAction extends React.PureComponent<DevMenuItemProps<DevMenuItemActionType>> {
  static contextType = DevMenuContext;

  action = (...args) => {
    dispatchActionAsync(...args);
    this.context?.collapse?.();
  };

  render() {
    const { actionId, label, glyphName, keyCommand } = this.props.item;

    return (
      <ListItemButton
        name={actionId}
        label={label}
        icon={glyphName}
        keyCommand={keyCommand}
        onPress={this.action}
      />
    );
  }
}

export default DevMenuItemAction;
