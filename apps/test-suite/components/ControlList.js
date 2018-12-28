'use strict';
import { Constants } from 'expo';
import React from 'react';
import { Button, View } from 'react-native';
import ModulesContext from '../ModulesContext';
import CheckList from './CheckList';
import SwitchItem from './SwitchItem';

class ControlList extends React.Component {
  onToggle = (...props) => {
    this.props.onUpdateData(...props);
  };

  renderItem = ({ item }) => {
    return <SwitchItem id={item.key} {...item} onToggle={this.onToggle} />;
  };

  render() {
    const { onToggleAll, isTesting, ...props } = this.props;
    return (
      <View
        style={{
          backgroundColor: '#edf2f6',
          paddingTop: Constants.statusBarHeight,
          flex: 1,
          justifyContent: 'space-between',
        }}>
        <CheckList {...props} />

        <Button disabled={isTesting} title="Toggle" onPress={onToggleAll} />
      </View>
    );
  }
}

export default class ContextControlList extends React.Component {
  render() {
    return (
      <ModulesContext.Consumer>
        {({ modules, onUpdateData, isTesting, onToggleAll }) => {
          return (
            <ControlList
              {...this.props}
              onToggleAll={onToggleAll}
              onUpdateData={onUpdateData}
              data={modules}
              isTesting={isTesting}
            />
          );
        }}
      </ModulesContext.Consumer>
    );
  }
}
