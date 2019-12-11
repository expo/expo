import Immutable from 'immutable';
import React from 'react';
import { View } from 'react-native';

import Portal from '../components/Portal';
import RunnerError from '../components/RunnerError';
import Suites from '../components/Suites';
import ModulesContext from '../ModulesContext';
import setupJasmine from '../utils/setupJasmine';

import useLinking from '../utils/useLinking';

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

class TestRunner extends React.Component {
  _lastUri;

  state = initialState;

  componentDidMount() {
    const { modules } = this.props;
    this._runTests(modules);
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setPortalChild = testPortal => {
    if (this._isMounted) this.setState({ testPortal });
  };

  cleanupPortal = () =>
    new Promise((resolve, reject) => {
      if (this._isMounted) this.setState({ testPortal: null }, resolve);
      else reject(new Error('cannot cleanup portal after the component has unmounted'));
    });

  // UNSAFE_componentWillReceiveProps({ modules: nextModules = [] }) {
  //   const { modules = [] } = this.props;
  //   if (modules !== nextModules) {
  //     this._resetAndRunTestsAsync(nextModules);
  //   }
  // }

  _resetAndRunTestsAsync = async modules => {
    // Reset results state
    this.setState(initialState);
    await this._runTests(modules);
  };

  _runTests = async modules => {
    // return new Promise(async resolve => {
    const { jasmineEnv, jasmine } = await setupJasmine(
      this,
      () => {
        // this.props.onTestsComplete(false);
      },
      () => {
        console.log('complete');
        // resolve();
        setTimeout(() => {
          // this.props.onTestsComplete(true);
        }, 100);
      }
    );

    console.log('runTests: ', modules);

    await Promise.all(
      modules.map(m =>
        m.test(jasmine, {
          setPortalChild: this.setPortalChild,
          cleanupPortal: this.cleanupPortal,
        })
      )
    );

    jasmineEnv.execute();
    // });
  };

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
      <View
        testID="test_suite_container"
        style={{
          flex: 1,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}>
        <Suites numFailed={numFailed} results={results} done={done} suites={state.get('suites')} />
        <Portal isVisible={portalChildShouldBeVisible}>{testPortal}</Portal>
      </View>
    );
  }
}

TestRunner.defaultProps = {
  modules: [],
};

export default function ContextTestScreen(props) {
  const { modules, setNavigation, onTestsComplete } = React.useContext(ModulesContext);
  const [selectedModules, setSelected] = React.useState(null);

  React.useEffect(() => {
    setNavigation(props.navigation);
    const selectedModules = modules.filter(({ isActive }) => isActive);
    // const selectedModules = props.navigation.getParam('tests');
    if (Array.isArray(selectedModules)) setSelected(selectedModules);
  }, []);

  if (!selectedModules) return null;

  return <TestRunner {...props} onTestsComplete={onTestsComplete} modules={selectedModules} />;
}
