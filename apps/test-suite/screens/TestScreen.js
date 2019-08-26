'use strict';

import React from 'react';
import { NativeModules, StyleSheet, Platform, ScrollView, Text, View } from 'react-native';
import jasmineModule from 'jasmine-core/lib/jasmine-core/jasmine';
import Immutable from 'immutable';

const { ExponentTest } = NativeModules;

export default class TestScreen extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = TestScreen.initialState;
    this._results = '';
    this._failures = '';
    this._scrollViewRef = null;
  }

  componentDidMount() {
    const { navigation } = this.props;
    const selectedModules = navigation.getParam('selected');
    this._runTests(selectedModules);
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  static navigationOptions = {
    title: 'Test Runner',
  };

  static initialState = {
    portalChildShouldBeVisible: false,
    state: Immutable.fromJS({
      suites: [],
      path: ['suites'], // Path to current 'children' List in state
    }),
    testPortal: null,
    numFailed: 0,
    done: false,
  };

  setPortalChild = testPortal => {
    if (this._isMounted) return this.setState({ testPortal });
  };

  cleanupPortal = () => {
    return new Promise(resolve => {
      if (this._isMounted) this.setState({ testPortal: null }, resolve);
    });
  };

  _runTests = async modules => {
    // Reset results state
    this.setState(TestScreen.initialState);

    const { jasmineEnv, jasmine } = await this._setupJasmine();

    await Promise.all(
      modules.map(m =>
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

      jasmineStarted() {
        console.log('--- tests started');
      },

      jasmineDone() {
        console.log('--- tests done');
        console.log('--- sending results to runner');
        if (app._isMounted) {
          app.setState({ done: true, numFailed: failedSpecs.length });
        }
        const result = {
          magic: '[TEST-SUITE-END]', // NOTE: Runner/Run.js waits to see this
          failed: failedSpecs.length,
          results: this._results,
        };
        if (Platform.OS === 'web') {
          // This log needs to be an object for puppeteer tests
          console.log(result);
        } else {
          const jsonResult = JSON.stringify(result);
          console.log(jsonResult);
        }

        if (ExponentTest) {
          ExponentTest.completed(
            JSON.stringify({
              failed: failedSpecs.length,
              failures: this._failures,
              results: this._results,
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
        }
      },

      suiteDone() {
        if (app._isMounted) {
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
        }
      },

      specStarted(jasmineResult) {
        if (app._isMounted) {
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
        }
      },

      specDone(jasmineResult) {
        if (app.state.testPortal) {
          console.warn(
            `The test portal has not been cleaned up by \`${
              jasmineResult.fullName
            }\`. Call \`cleanupPortal\` before finishing the test.`
          );
        }
        if (app._isMounted) {
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
        }
      },
    };
  }

  _renderSpecResult = r => {
    const status = r.get('status') || 'running';
    return (
      <View
        key={r.get('id')}
        style={{
          paddingLeft: 10,
          marginVertical: 3,
          borderColor: {
            running: '#ff0',
            passed: '#0f0',
            failed: '#f00',
            disabled: '#888',
          }[status],
          borderLeftWidth: 3,
        }}>
        <Text style={{ fontSize: 16 }}>
          {
            {
              running: '😮 ',
              passed: '😄 ',
              failed: '😞 ',
            }[status]
          }
          {r.get('description')} ({status})
        </Text>
        {r.get('failedExpectations').map((e, i) => (
          <Text key={i}>{e.get('message')}</Text>
        ))}
      </View>
    );
  };

  _renderSuiteResult = (r, depth) => {
    const titleStyle =
      depth === 0
        ? { marginBottom: 8, fontSize: 16, fontWeight: 'bold' }
        : { marginVertical: 8, fontSize: 16 };
    const containerStyle =
      depth === 0
        ? {
            paddingLeft: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: '#ddd',
          }
        : { paddingLeft: 16 };
    return (
      <View key={r.get('result').get('id')} style={containerStyle}>
        <Text style={titleStyle}>{r.get('result').get('description')}</Text>
        {r.get('specs').map(this._renderSpecResult)}
        {r.get('children').map(r => this._renderSuiteResult(r, depth + 1))}
      </View>
    );
  };

  _onScrollViewContentSizeChange = () => {
    if (this._scrollViewRef) {
      this._scrollViewRef.scrollToEnd();
    }
  };

  _renderDoneText = () => {
    if (this.state.done) {
      return (
        <Text style={styles.doneMessage}>
          All done! {this.state.numFailed} {this.state.numFailed === 1 ? 'test' : 'tests'} failed.
        </Text>
      );
    }
  };

  _renderPortal = () => {
    const styles = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgb(255, 255, 255)',
      opacity: this.state.portalChildShouldBeVisible ? 0.5 : 0,
    };

    if (this.state.testPortal) {
      return (
        <View style={styles} pointerEvents="none">
          {this.state.testPortal}
        </View>
      );
    }
  };

  render() {
    return (
      <View style={styles.scrollViewContainer} testID="test_suite_container">
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          ref={ref => (this._scrollViewRef = ref)}
          onContentSizeChange={this._onScrollViewContentSizeChange}>
          {this.state.state.get('suites').map(r => this._renderSuiteResult(r, 0))}
          {this._renderDoneText()}
        </ScrollView>
        {this._renderPortal()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  scrollViewContent: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  doneMessage: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
