'use strict';
import React from 'react';
import { AsyncStorage, View } from 'react-native';

import CheckList from './components/CheckList';
import Settings from './constants/Settings';
import getTestModulesAsync from './getTestModulesAsync';
import TestsScreen from './screens/TestsScreen';

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

export default class App extends React.Component {
  // --- Lifecycle -------------------------------------------------------------

  state = {
    modules: {},
  };

  async componentDidMount() {
    const modules = await getTestModulesAsync();

    const modulesMap = {};

    for (let index in modules) {
      const module = modules[index];
      const key = module.name.replace(' ', '_');
      modulesMap[key] = {
        index,
        key,
        isActive: true,
        ...module,
      };
    }

    const rehydratedModulesMap = await rehydrateModules(modulesMap);
    console.log({ rehydratedModulesMap });
    this.setState({ modules: rehydratedModulesMap, isLoaded: true });
  }

  onUpdateData = async (key, isActive) => {
    const { modules } = this.state;
    if (modules[key]) {
      modules[key].isActive = isActive;
    }

    this.setState({ modules });

    cacheModules(modules);
  };

  render() {
    const { modules, isLoaded } = this.state;
    const modulesList = Object.values(modules);

    if (!isLoaded) {
      return <View />;
    }

    const activeModules = modulesList.filter(({ isActive }) => isActive);
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'stretch',
          justifyContent: 'center',
          flexDirection: 'row',
        }}>
        <CheckList data={modulesList} onUpdateData={this.onUpdateData} />
        <TestsScreen initialUri={this.props.exp.initialUri} modules={activeModules} />
      </View>
    );
  }
}
