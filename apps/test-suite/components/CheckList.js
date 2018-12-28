'use strict';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import SwitchItem from './SwitchItem';

export default class CheckList extends React.Component {
  onToggle = (...props) => {
    this.props.onUpdateData(...props);
  };

  renderItem = ({ item }) => {
    return <SwitchItem id={item.key} {...item} onToggle={this.onToggle} />;
  };

  render() {
    return (
      <FlatList
        style={StyleSheet.flatten([
          {
            flex: 1,
          },
          this.props.style,
        ])}
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
