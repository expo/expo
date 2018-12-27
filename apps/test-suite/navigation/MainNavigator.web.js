import { createNavigator, SceneView, SwitchRouter } from '@react-navigation/core';
import React from 'react';

import CheckList from '../components/CheckList';
import ModulesProvider from '../ModulesProvider';
import TestsScreen from '../screens/TestsScreen';

class SidebarView extends React.Component {
  render() {
    const { descriptors, navigation } = this.props;
    console.log({ props: this.props });
    const activeKey = navigation.state.routes[navigation.state.index].key;
    const descriptor = descriptors[activeKey];
    return (
      <div style={{ display: 'flex', height: '100%', justifyContent: 'stretch' }}>
        <div
          style={{
            width: 300,
            height: '100%',
            backgroundColor: '#efefef',
            borderRight: '1px solid #99b',
          }}>
          <CheckList />
        </div>
        <div>
          <SceneView component={descriptor.getComponent()} navigation={descriptor.navigation} />
        </div>
      </div>
    );
  }
}

const AppNavigator = createNavigator(
  SidebarView,
  SwitchRouter({
    TestsScreen,
  }),
  {}
);

export default AppNavigator;
