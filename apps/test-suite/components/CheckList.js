'use strict';
import React from 'react';
import { FlatList, Switch, Text, View } from 'react-native';

import Colors from '../constants/Colors';
import ModulesContext from '../ModulesContext';

class CheckList extends React.Component {
  onValueChange = (item, value) => {
    this.props.onUpdateData(item.key, value);
  };

  renderItem = ({ item }) => {
    const { isActive, key, name } = item;
    const fontWeight = isActive ? 'bold' : undefined;
    const testID = `CheckList-Switch-${key}`;
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginVertical: 8,
          marginHorizontal: 16,
        }}>
        <Text style={{ fontWeight, marginRight: 8 }}>{name}</Text>
        <Switch
          testID={testID}
          value={isActive}
          onValueChange={value => this.onValueChange(item, value)}
        />
      </View>
    );
  };

  render() {
    console.log(this.props.data);
    return (
      <FlatList
        style={{
          flex: 1,
          backgroundColor: '#edf2f6',
        }}
        contentContainerStyle={{
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
        data={this.props.data}
        renderItem={this.renderItem}
      />
    );
  }
}

export default class ContextCheckList extends React.Component {
  render() {
    return (
      <ModulesContext.Consumer>
        {({ modules, onUpdateData }) => {
          return <CheckList {...this.props} onUpdateData={onUpdateData} data={modules} />;
        }}
      </ModulesContext.Consumer>
    );
  }
}
