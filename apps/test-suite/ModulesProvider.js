import * as React from 'react';
import { View, AsyncStorage } from 'react-native';
// import AsyncStorage from '@react-native-community/async-storage';

import { getTestModulesAsync } from './TestUtils';
import ModulesContext from './ModulesContext';
import useLinking from './utils/useLinking';

const activeTestsStorageKey = '@TestSuite:activeTests';
const shouldRehydrate = true;

async function cacheModules(modules) {
  let parsedModules = {};

  for (let key in modules) {
    const module = modules[key];
    parsedModules[key] = module.isActive;
  }

  await AsyncStorage.setItem(activeTestsStorageKey, JSON.stringify(parsedModules));
}

async function rehydrateModules(modules) {
  if (!shouldRehydrate) {
    return modules;
  }
  const outputModules = { ...modules };
  try {
    const modulesString = await AsyncStorage.getItem(activeTestsStorageKey);
    if (modulesString) {
      /* This should be an object like: { [key]: isActive } */
      const rehydratedModules = JSON.parse(modulesString);

      for (const key in rehydratedModules) {
        if (key in outputModules) {
          outputModules[key].isActive = rehydratedModules[key];
        }
      }
    }
  } finally {
    return outputModules;
  }
}

function getCanReset(modules) {
  for (const module of Object.values(modules)) {
    if (module.isActive === false) {
      return true;
    }
  }
  return false;
}

export default function ModulesProvider({ children }) {
  const [modules, setModules] = React.useState({});
  const [isTesting, setTesting] = React.useState(false);
  const [isLoaded, setLoaded] = React.useState(false);

  const link = useLinking();

  React.useEffect(() => {
    if (!link) return;
    const last = link.split('/').pop();
    const _modules = { ...modules };
    if (last === 'all') {
      for (const key in _modules) {
        _modules[key].isActive = true;
      }
    } else {
      const testNames = last.split(',').map(v => v.trim());
      const validTestNames = testNames.filter(name => !!_modules[name]);
      for (const key in _modules) {
        _modules[key].isActive = validTestNames.includes(key);
      }
    }

    if (Object.keys(_modules).length) {
      setModules(_modules);
      cacheModules(_modules);
    }
  }, [link]);

  React.useEffect(() => {
    const modulesMap = {};
    const parseModulesAsync = async () => {
      const MODULES = await getTestModulesAsync();
      for (let module of MODULES) {
        if (!module) continue;
        if (!module.name || module.name === '') {
          throw new Error(
            'Module name is invalid. Expected a string with the name of the test to be exported: ' +
            JSON.stringify(module, null, 2) +
            ' '
          );
        }
        const key = module.name.replace(' ', '_');
        modulesMap[key] = {
          key,
          isActive: true,
          ...module,
        };
      }

      const rehydratedModulesMap = await rehydrateModules(modulesMap);

      setModules(rehydratedModulesMap);
      setLoaded(true);
    };

    parseModulesAsync();
  }, []);

  if (!isLoaded) {
    return <View />;
  }

  const setIsTestActive = async (key, isActive) => {
    // if (isTesting) return;
    const _modules = { ...modules };
    if (_modules[key]) {
      _modules[key].isActive = isActive;
    }
    setModules(_modules);
    cacheModules(_modules);
  };

  const onToggleAll = () => {
    if (isTesting) return;
    const _modules = { ...modules };

    let toggleDirection;
    for (const module of Object.values(_modules)) {
      if (toggleDirection === undefined) {
        toggleDirection = !module.isActive;
      }
      module.isActive = toggleDirection;
    }

    setModules(_modules);
    cacheModules(_modules);
  };

  return (
    <ModulesContext.Provider
      value={{
        modules: Object.values(modules),
        onTestsComplete: isComplete => setTesting(!isComplete),
        setIsTestActive,
        onToggleAll,
      }}>
      {children}
    </ModulesContext.Provider>
  );
}
