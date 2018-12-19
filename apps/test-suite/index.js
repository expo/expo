'use strict';
import { Constants, registerRootComponent } from 'expo';
import Immutable from 'immutable';
import jasmineModule from 'jasmine-core/lib/jasmine-core/jasmine';
import React from 'react';
import { Linking, NativeModules, View } from 'react-native';

import Portal from './components/Portal';
import RunnerError from './components/RunnerError';
import Suites from './components/Suites';
import getTestModulesAsync from './getTestModulesAsync';

const { ExponentTest } = NativeModules;

class App extends React.Component {
  // --- Lifecycle -------------------------------------------------------------

  state = App.initialState;
  _results = '';
  _failures = '';
  _scrollViewRef = null;

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

    const { jasmineEnv, jasmine } = await this._setupJasmine();

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

  async _setupJasmine() {
    // Init
    jasmineModule.DEFAULT_TIMEOUT_INTERVAL = 10000;
    const jasmineCore = jasmineModule.core(jasmineModule);
    const jasmineEnv = jasmineCore.getEnv();

    // Add our custom reporters too
    jasmineEnv.addReporter(this._jasmineSetStateReporter());
    jasmineEnv.addReporter(this._jasmineConsoleReporter());

    // Get the interface and make it support `async ` by default
    const jasmine = jasmineModule.interface(jasmineCore, jasmineEnv);
    const doneIfy = fn => async done => {
      try {
        await Promise.resolve(fn());
        done();
      } catch (e) {
        done.fail(e);
      }
    };
    const oldIt = jasmine.it;
    jasmine.it = (desc, fn, t) => oldIt.apply(jasmine, [desc, doneIfy(fn), t]);
    const oldXit = jasmine.xit;
    jasmine.xit = (desc, fn, t) => oldXit.apply(jasmine, [desc, doneIfy(fn), t]);
    const oldFit = jasmine.fit;
    jasmine.fit = (desc, fn, t) => oldFit.apply(jasmine, [desc, doneIfy(fn), t]);

    return {
      jasmineCore,
      jasmineEnv,
      jasmine,
    };
  }

  // A jasmine reporter that writes results to the console
  _jasmineConsoleReporter(jasmineEnv) {
    const failedSpecs = [];

    return {
      specDone(result) {
        if (result.status === 'passed' || result.status === 'failed') {
          // Open log group if failed
          const grouping = result.status === 'passed' ? '---' : '+++';
          if (ExponentTest && ExponentTest.log) {
            ExponentTest.log(`${result.status === 'passed' ? 'PASS' : 'FAIL'} ${result.fullName}`);
          }
          const emoji = result.status === 'passed' ? ':green_heart:' : ':broken_heart:';
          console.log(`${grouping} ${emoji} ${result.fullName}`);
          this._results += `${grouping} ${result.fullName}\n`;

          if (result.status === 'failed') {
            this._failures += `${grouping} ${result.fullName}\n`;
            result.failedExpectations.forEach(({ matcherName, message }) => {
              if (ExponentTest && ExponentTest.log) {
                ExponentTest.log(`${matcherName}: ${message}`);
              }
              console.log(`${matcherName}: ${message}`);
              this._results += `${matcherName}: ${message}\n`;
              this._failures += `${matcherName}: ${message}\n`;
            });
            failedSpecs.push(result);
          }
        }
      },

      suiteDone(result) {},

      jasmineStarted() {
        console.log('--- tests started');
      },

      jasmineDone() {
        console.log('--- tests done');
        console.log('--- send results to runner');
        let result = JSON.stringify({
          magic: '[TEST-SUITE-END]', // NOTE: Runner/Run.js waits to see this
          failed: failedSpecs.length,
          results: this._results,
        });
        console.log(result);

        if (ExponentTest) {
          // Native logs are truncated so log just the failures for now
          ExponentTest.completed(
            JSON.stringify({
              failed: failedSpecs.length,
              failures: this._failures,
            })
          );
        }
      },
    };
  }

  // A jasmine reporter that writes results to this.state
  _jasmineSetStateReporter(jasmineEnv) {
    const app = this;
    return {
      suiteStarted(jasmineResult) {
        app.setState(({ state }) => ({
          state: state
            .updateIn(state.get('path'), children =>
              children.push(
                Immutable.fromJS({
                  result: jasmineResult,
                  children: [],
                  specs: [],
                })
              )
            )
            .update('path', path => path.push(state.getIn(path).size, 'children')),
        }));
      },

      suiteDone(jasmineResult) {
        app.setState(({ state }) => ({
          state: state
            .updateIn(
              state
                .get('path')
                .pop()
                .pop(),
              children =>
                children.update(children.size - 1, child =>
                  child.set('result', child.get('result'))
                )
            )
            .update('path', path => path.pop().pop()),
        }));
      },

      specStarted(jasmineResult) {
        app.setState(({ state }) => ({
          state: state.updateIn(
            state
              .get('path')
              .pop()
              .pop(),
            children =>
              children.update(children.size - 1, child =>
                child.update('specs', specs => specs.push(Immutable.fromJS(jasmineResult)))
              )
          ),
        }));
      },

      specDone(jasmineResult) {
        if (app.state.testPortal) {
          console.warn(
            `The test portal has not been cleaned up by \`${
              jasmineResult.fullName
            }\`. Call \`cleanupPortal\` before finishing the test.`
          );
        }

        app.setState(({ state }) => ({
          state: state.updateIn(
            state
              .get('path')
              .pop()
              .pop(),
            children =>
              children.update(children.size - 1, child =>
                child.update('specs', specs =>
                  specs.set(specs.size - 1, Immutable.fromJS(jasmineResult))
                )
              )
          ),
        }));
      },
    };
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
registerRootComponent(App);
