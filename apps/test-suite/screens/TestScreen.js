'use strict';
import Immutable from 'immutable';
import jasmineModule from 'jasmine-core/lib/jasmine-core/jasmine';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import ExponentTest from '../ExponentTest';
import { getTestModules } from '../TestModules';
import Portal from '../components/Portal';
import RunnerError from '../components/RunnerError';
import Suites from '../components/Suites';

const initialState = {
  portalChildShouldBeVisible: false,
  state: Immutable.fromJS({
    suites: [],
    path: ['suites'], // Path to current 'children' List in state
  }),
  testPortal: null,
  numFailed: 0,
  done: false,
};

export default class TestScreen extends React.Component {
  state = initialState;
  _results = '';
  _failures = '';
  _scrollViewRef = null;

  componentDidMount() {
    const selectionQuery = this.props.route.params?.tests ?? [];
    const selectedTestNames = selectionQuery.split(' ');

    // We get test modules here to make sure that React Native will reload this component when tests were changed.
    const selectedModules = getTestModules().filter((m) => selectedTestNames.includes(m.name));

    if (!selectedModules.length) {
      console.log('[TEST_SUITE]', 'No selected modules', selectedTestNames);
    }

    this._runTests(selectedModules);
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setPortalChild = (testPortal) => {
    if (this._isMounted) return this.setState({ testPortal });
  };

  cleanupPortal = () => {
    return new Promise((resolve) => {
      if (this._isMounted) this.setState({ testPortal: null }, resolve);
    });
  };

  _runTests = async (modules) => {
    // Reset results state
    this.setState(initialState);

    const { jasmineEnv, jasmine } = await this._setupJasmine();

    await Promise.all(
      modules.map((m) =>
        m.test(jasmine, {
          setPortalChild: this.setPortalChild,
          cleanupPortal: this.cleanupPortal,
        })
      )
    );

    jasmineEnv.execute();
  };

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
    const doneIfy = (fn) => async (done) => {
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
  _jasmineConsoleReporter() {
    const failedSpecs = [];
    const app = this;

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
          app._results += `${grouping} ${result.fullName}\n`;

          if (result.status === 'failed') {
            app._failures += `${grouping} ${result.fullName}\n`;
            result.failedExpectations.forEach(({ matcherName = 'NO_MATCHER', message }) => {
              if (ExponentTest && ExponentTest.log) {
                ExponentTest.log(`${matcherName}: ${message}`);
              }
              console.log(`${matcherName}: ${message}`);
              app._results += `${matcherName}: ${message}\n`;
              app._failures += `${matcherName}: ${message}\n`;
            });
            failedSpecs.push(result);
            if (app._isMounted) {
              const result = {
                magic: '[TEST-SUITE-INPROGRESS]',
                failed: failedSpecs.length,
                failures: app._failures,
                results: app._results,
              };
              const jsonResult = JSON.stringify(result);
              app.setState({ numFailed: failedSpecs.length, results: jsonResult });
            }
          }
        }
      },

      jasmineStarted() {
        console.log('--- tests started');
      },

      jasmineDone() {
        console.log('--- tests done');
        console.log('--- sending results to runner');

        const result = {
          magic: '[TEST-SUITE-END]', // NOTE: Runner/Run.js waits to see this
          failed: failedSpecs.length,
          failures: app._failures,
          results: app._results,
        };

        const jsonResult = JSON.stringify(result);
        if (app._isMounted) {
          app.setState({ done: true, numFailed: failedSpecs.length, results: jsonResult });
        }

        console.log(jsonResult);

        if (ExponentTest) {
          ExponentTest.completed(
            JSON.stringify({
              failed: failedSpecs.length,
              failures: app._failures,
              results: app._results,
            })
          );
        }
      },
    };
  }

  // A jasmine reporter that writes results to this.state
  _jasmineSetStateReporter() {
    const app = this;
    return {
      suiteStarted(jasmineResult) {
        if (app._isMounted) {
          app.setState(({ state }) => ({
            state: state
              .updateIn(state.get('path'), (children) =>
                children.push(
                  Immutable.fromJS({
                    result: jasmineResult,
                    children: [],
                    specs: [],
                  })
                )
              )
              .update('path', (path) => path.push(state.getIn(path).size, 'children')),
          }));
        }
      },

      suiteDone() {
        if (app._isMounted) {
          app.setState(({ state }) => ({
            state: state
              .updateIn(state.get('path').pop().pop(), (children) =>
                children.update(children.size - 1, (child) =>
                  child.set('result', child.get('result'))
                )
              )
              .update('path', (path) => path.pop().pop()),
          }));
        }
      },

      specStarted(jasmineResult) {
        if (app._isMounted) {
          app.setState(({ state }) => ({
            state: state.updateIn(state.get('path').pop().pop(), (children) =>
              children.update(children.size - 1, (child) =>
                child.update('specs', (specs) => specs.push(Immutable.fromJS(jasmineResult)))
              )
            ),
          }));
        }
      },

      specDone(jasmineResult) {
        if (app.state.testPortal) {
          console.warn(
            `The test portal has not been cleaned up by \`${jasmineResult.fullName}\`. Call \`cleanupPortal\` before finishing the test.`
          );
        }
        if (app._isMounted) {
          app.setState(({ state }) => ({
            state: state.updateIn(state.get('path').pop().pop(), (children) =>
              children.update(children.size - 1, (child) =>
                child.update('specs', (specs) =>
                  specs.set(specs.size - 1, Immutable.fromJS(jasmineResult))
                )
              )
            ),
          }));
        }
      },
    };
  }

  render() {
    const {
      testRunnerError,
      results,
      done,
      numFailed,
      state,
      portalChildShouldBeVisible,
      testPortal,
    } = this.state;
    if (testRunnerError) {
      return <RunnerError>{testRunnerError}</RunnerError>;
    }
    return (
      <View testID="test_suite_container" style={styles.container}>
        <Suites numFailed={numFailed} results={results} done={done} suites={state.get('suites')} />
        <Portal isVisible={portalChildShouldBeVisible}>{testPortal}</Portal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
