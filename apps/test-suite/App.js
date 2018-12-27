'use strict';
import { Constants } from 'expo';
import Immutable from 'immutable';
import React from 'react';
import { Linking, View } from 'react-native';

import Portal from './components/Portal';
import RunnerError from './components/RunnerError';
import Suites from './components/Suites';
import getTestModulesAsync from './getTestModulesAsync';
import setupJasmine from './setupJasmine';

export default class App extends React.Component {
  // --- Lifecycle -------------------------------------------------------------

  constructor(...props) {
    super(...props);

    this.state = App.initialState;
  }

  componentDidMount() {
    this._runTests(this.props.exp.initialUri);
    Linking.addEventListener('url', ({ url }) => url && this._runTests(url));
  }

  // --- Test running ----------------------------------------------------------

  static initialState = {
    portalChildShouldBeVisible: false,
    testRunnerError: null,
    state: Immutable.fromJS({
      suites: [],
      path: ['suites'], // Path to current 'children' List in state
    }),
  };

  setPortalChild = testPortal => this.setState({ testPortal });
  cleanupPortal = () => new Promise(resolve => this.setState({ testPortal: null }, resolve));

  async _runTests(uri) {
    // If the URL contains two pluses let's keep the existing state instead of rerunning tests.
    // This way we are able to test the Linking module.
    if (uri && uri.indexOf('++') > -1) {
      return;
    }

    // Reset results state
    this.setState(App.initialState);

    const { jasmineEnv, jasmine } = await setupJasmine(this);

    // Load tests, confining to the ones named in the uri
    let modules = await getTestModulesAsync();
    if (uri && uri.indexOf('--/') > -1) {
      const deepLink = uri.substring(uri.indexOf('--/') + 3);
      const filterJSON = JSON.parse(deepLink);
      if (filterJSON.includeModules) {
        console.log('Only testing these modules: ' + JSON.stringify(filterJSON.includeModules));
        const includeModulesRegexes = filterJSON.includeModules.map(m => new RegExp(m));
        modules = modules.filter(m => {
          for (let i = 0; i < includeModulesRegexes.length; i++) {
            if (includeModulesRegexes[i].test(m.name)) {
              return true;
            }
          }

          return false;
        });

        if (modules.length === 0) {
          this.setState({
            testRunnerError: `No tests were found that satisfy ${deepLink}`,
          });
          return;
        }
      }
    }

    await Promise.all(
      modules.map(m =>
        m.test(jasmine, {
          setPortalChild: this.setPortalChild,
          cleanupPortal: this.cleanupPortal,
        })
      )
    );

    jasmineEnv.execute();
  }

  render() {
    const { testRunnerError, state, portalChildShouldBeVisible, testPortal } = this.state;
    if (testRunnerError) {
      return <RunnerError>{testRunnerError}</RunnerError>;
    }

    return (
      <View
        style={{
          flex: 1,
          marginTop: Constants.statusBarHeight || 18,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
        testID="test_suite_container">
        <Suites suites={state.get('suites')} />
        {testPortal && <Portal isVisible={portalChildShouldBeVisible}>{testPortal}</Portal>}
      </View>
    );
  }
}
