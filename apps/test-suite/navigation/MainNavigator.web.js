import { createNavigator, SceneView, SwitchRouter } from '@react-navigation/core';
import { Link } from '@react-navigation/web';
import React from 'react';

import TestsScreen from '../screens/TestsScreen';

class SidebarView extends React.Component {
  render() {
    const { descriptors, navigation } = this.props;
    const activeKey = navigation.state.routes[navigation.state.index].key;
    const descriptor = descriptors[activeKey];
    return (
      <div style={{ display: 'flex', height: '100%', justifyContent: 'stretch' }}>
        <div
          style={{
            width: 300,
            backgroundColor: '#efefef',
            borderRight: '1px solid #99b',
          }}>
          <h1>Hello, Navigation</h1>
          <Link routeName="Home">Home</Link>
          <Link routeName="About">About</Link>
          <Link routeName="Profile" params={{ name: 'jamie' }}>
            About Jamie
          </Link>
          <Link routeName="Profile" params={{ name: 'brent' }}>
            About Brent
          </Link>
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
