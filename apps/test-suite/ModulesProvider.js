import * as React from 'react';
import { AsyncStorage, View } from 'react-native';

import Settings from './constants/Settings';
import getTestModulesAsync from './getTestModulesAsync';
import ModulesContext from './ModulesContext';

const activeTestsStorageKey = '@TestSuite:activeTests';

async function cacheModules(modules) {
  let parsedModules = {};

  for (let key in modules) {
    const module = modules[key];
    parsedModules[key] = module.isActive;
  }

  await AsyncStorage.setItem(activeTestsStorageKey, JSON.stringify(parsedModules));
}

async function rehydrateModules(modules) {
  if (!Settings.shouldRehydrate) {
    return modules;
  }
  try {
    const modulesString = await AsyncStorage.getItem(activeTestsStorageKey);
    if (modulesString) {
      /* This should be an object like: { [key]: isActive } */
      const rehydratedModules = JSON.parse(modulesString);

      const outputModules = { ...modules };

      for (const key in rehydratedModules) {
        if (key in outputModules) {
          outputModules[key].isActive = rehydratedModules[key];
        }
      }
      return outputModules;
    }
  } catch (error) {}
  return modules;
}

function getCanReset(modules) {
  for (const module of Object.values(modules)) {
    if (module.isActive === false) {
      return true;
    }
  }
  return false;
}

export default class ModulesProvider extends React.Component {
  state = {
    modules: {},
    screenKey: 'screen',
    isTesting: false,
  };

  componentDidMount() {
    this.parseModulesAsync();
  }

  parseModulesAsync = async () => {
    const modules = await getTestModulesAsync();

    const modulesMap = {};

    for (let index in modules) {
      const module = modules[index];
      if (!module) continue;
      if (!module.name || module.name === '') {
        throw new Error(
          'Module name is invalid. Expected a string with the name of the test to be exported: ' +
            JSON.stringify(module) +
            ' ' +
            index
        );
      }
      const key = module.name.replace(' ', '_');
      modulesMap[key] = {
        index,
        key,
        isActive: true,
        ...module,
      };
    }

    const rehydratedModulesMap = await rehydrateModules(modulesMap);
    this.setState({ modules: rehydratedModulesMap, isLoaded: true });
  };

  onUpdateData = async (key, isActive) => {
    if (this._isTesting) return;
    const { modules } = this.state;
    if (modules[key]) {
      modules[key].isActive = isActive;
    }
    this.setState({ modules });

    cacheModules(modules);
  };

  onToggleAll = () => {
    if (this._isTesting) return;
    const { modules } = this.state;

    let toggleDirection;
    for (const key in modules) {
      if (toggleDirection === undefined) {
        toggleDirection = !modules[key].isActive;
      }
      modules[key].isActive = toggleDirection;
    }

    this.setState({ modules });

    cacheModules(modules);
  };

  onTestsComplete = isComplete => {
    this._isTesting = !isComplete;
    // this.setState({ isTesting });
  };

  render() {
    const { modules, screenKey, isTesting, isLoaded } = this.state;
    const modulesList = Object.values(modules);

    if (!isLoaded) {
      return <View />;
    }

    return (
      <ModulesContext.Provider
        value={{
          modules: modulesList,
          onUpdateData: this.onUpdateData,
          onToggleAll: this.onToggleAll,
          onTestsComplete: this.onTestsComplete,
          screenKey,
        }}>
        {this.props.children}
      </ModulesContext.Provider>
    );
  }
}
