/* @flow */

import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';

const DEFAULT_PRESS_IN_DELAY_MS = 80;

export default function createSelectableComponent(
  TargetComponent: any,
  selectableProps: Object = {}
) {
  class SelectableComponent extends React.Component {
    render() {
      const { onLongPress, onPress, onPressIn, onPressOut, ...childProps } = this.props;

      return (
        <Selectable
          {...selectableProps}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressLongPress={onLongPress}
          onPressOut={onPressOut}>
          <TargetComponent {...childProps} />
        </Selectable>
      );
    }
  }

  return SelectableComponent;
}

class Selectable extends React.Component {
  static createSelectableComponent = createSelectableComponent;

  state = {
    isSelected: false,
  };

  render() {
    let child = React.cloneElement(React.Children.only(this.props.children), {
      selected: this.state.isSelected,
    });

    return (
      <TouchableWithoutFeedback
        delayPressIn={DEFAULT_PRESS_IN_DELAY_MS}
        {...this.props}
        onPressIn={e => this._handlePressIn(e)}
        onPressOut={e => this._handlePressOut(e)}>
        {child}
      </TouchableWithoutFeedback>
    );
  }

  _handlePressIn = event => {
    if (this.props.onPressIn) {
      this.props.onPressIn(event);
    }
    this.setState({ isSelected: true });
  };

  _handlePressOut = event => {
    if (this.props.onPressOut) {
      this.props.onPressOut(event);
    }
    this.setState({ isSelected: false });
  };
}
