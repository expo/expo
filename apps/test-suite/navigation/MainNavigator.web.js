import { createNavigator, SceneView, SwitchRouter } from '@react-navigation/core';
import React from 'react';
import { View } from 'react-native';

import ControlList from '../components/ControlList';
import Tests from '../screens/TestsScreen';

class SidebarView extends React.Component {
  render() {
    const { descriptors, navigation } = this.props;
    const activeKey = navigation.state.routes[navigation.state.index].key;
    const descriptor = descriptors[activeKey];

    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          flex: 1,
        }}>
        <ControlList />
        <View style={{ flex: 2 }}>
          <SceneView component={descriptor.getComponent()} navigation={descriptor.navigation} />
        </View>
      </View>
    );
  }
}

const AppNavigator = createNavigator(
  SidebarView,
  SwitchRouter({
    Tests,
  }),
  {}
);

export default AppNavigator;
