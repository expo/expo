'use strict';
import { Constants } from 'expo';
import Immutable from 'immutable';
import React from 'react';
import { Linking, View } from 'react-native';

import Portal from '../components/Portal';
import RunnerError from '../components/RunnerError';
import Suites from '../components/Suites';
import ModulesContext from '../ModulesContext';
import setupJasmine from '../setupJasmine';

class TestsScreen extends React.Component {
  static initialState = {
    portalChildShouldBeVisible: false,
    testRunnerError: null,
    state: Immutable.fromJS({
      suites: [],
      path: ['suites'], // Path to current 'children' List in state
    }),
  };
  static defaultProps = {
    modules: [],
  };

  _lastUri;

  state = TestsScreen.initialState;
  // --- Lifecycle -------------------------------------------------------------

  async componentDidMount() {
    const initialUri = await Linking.getInitialURL();
    this._runTests(initialUri);
    Linking.addEventListener('url', this.foundNewURL);
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.foundNewURL);
  }

  foundNewURL = ({ url }) => {
    if (url) {
      this._runTests(url);
    }
  };

  // --- Test running ----------------------------------------------------------

  setPortalChild = testPortal => this.setState({ testPortal });

  cleanupPortal = () => new Promise(resolve => this.setState({ testPortal: null }, resolve));

  get validUri() {
    return this._lastUri || this.props.initialUri;
  }

  componentWillReceiveProps({ modules: nextModules = [] }) {
    const { modules = [] } = this.props;
    if (modules !== nextModules) {
      this._runTests(this.validUri);
    }
  }

  async _runTests(uri) {
    this._lastUri = uri;
    // If the URL contains two pluses let's keep the existing state instead of rerunning tests.
    // This way we are able to test the Linking module.
    if (uri && uri.indexOf('++') > -1) {
      return;
    }

    // Reset results state
    this.setState(TestsScreen.initialState);

    const { jasmineEnv, jasmine } = await setupJasmine(
      this,
      () => {
        this.props.onTestsComplete(false);
      },
      () => {
        console.log('complete');
        setTimeout(() => {
          this.props.onTestsComplete(true);
        }, 100);
      }
    );

    // Load tests, confining to the ones named in the uri
    let modules = [...this.props.modules];
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

export default class ContextTestScreen extends React.Component {
  render() {
    return (
      <ModulesContext.Consumer>
        {({ modules, onTestsComplete }) => {
          const activeModules = modules.filter(({ isActive }) => isActive);
          return (
            <TestsScreen
              {...this.props}
              onTestsComplete={onTestsComplete}
              modules={activeModules}
            />
          );
        }}
      </ModulesContext.Consumer>
    );
  }
}
