import React from 'react';

import DevMenuContext from '../../DevMenuContext';
import {
  DevMenuItemProps,
  DevMenuItemActionType,
  dispatchCallableAsync,
} from '../../DevMenuInternal';
import ListItemButton from '../../components/ListItemButton';

class DevMenuItemAction extends React.PureComponent<DevMenuItemProps<DevMenuItemActionType>> {
  static contextType = DevMenuContext;

  action = (...args) => {
    dispatchCallableAsync(...args);
    this.context?.collapse?.();
  };

  render() {
    const { actionId, label, glyphName, keyCommand, isAvailable } = this.props.item;
    const disabled = !(isAvailable ?? true);
    return (
      <ListItemButton
        name={actionId}
        label={label}
        icon={glyphName}
        keyCommand={keyCommand}
        onPress={this.action}
        disabled={disabled}
      />
    );
  }
}

export default DevMenuItemAction;
