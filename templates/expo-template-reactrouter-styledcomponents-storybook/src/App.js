import React from 'react';
import { registerRootComponent } from 'expo';
import { activateKeepAwake } from 'expo-keep-awake';
import { Router, Route } from './navigation/router';
import { routes } from './navigation/routes';
import HomeScreen from './screens/Home';
import SettingsScreen from './screens/Settings';

const App = () => {
  return (
    <>
      <Router>
        <Route exact path={routes.home()} component={HomeScreen} />
        <Route exact path={routes.settings()} component={SettingsScreen} />
      </Router>
    </>
  );
}

if (__DEV__) {
  activateKeepAwake();
}

registerRootComponent(App);
