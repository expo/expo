'use strict';
import React from 'react';
import { Switch, Text, View } from 'react-native';

export default class SwitchItem extends React.Component {
  onValueChange = value => {
    this.props.onToggle(this.props.id, value);
  };

  render() {
    const { isActive, id, name } = this.props;
    const fontWeight = isActive ? 'bold' : undefined;
    const testID = `CheckList-Switch-${id}`;
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 8,
          marginHorizontal: 16,
        }}>
        <Text style={{ fontWeight, marginRight: 8 }}>{name}</Text>
        <Switch testID={testID} value={isActive} onValueChange={this.onValueChange} />
      </View>
    );
  }
}
