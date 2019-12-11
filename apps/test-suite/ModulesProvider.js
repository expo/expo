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

let lastLink = null;
let needsNavigate = false;

export default function ModulesProvider({ children }) {
  const [navigation, setNavigation] = React.useState(null);
  const [needsNavigate, setNeedsNavigate] = React.useState(null);
  const [modules, setModules] = React.useState({});
  const [isTesting, setTesting] = React.useState(false);
  const [isLoaded, setLoaded] = React.useState(false);

  function processLink(link) {
    if (!link) return;
    if (!Object.keys(modules).length) {
      lastLink = link;
      return;
    } else if (!lastLink) {
      return;
    }
    link = lastLink;
    lastLink = null;

    const last = link.split('/').pop();
    console.log('new link -> ', link, last);
    const _modules = { ...modules };
    let hasNewModules = false;
    if (last === 'all') {
      for (const key in _modules) {
        _modules[key].isActive = true;
      }
      hasNewModules = true;
    } else {
      const testNames = last.split(',').map(v => v.trim());
      const validTestNames = testNames.filter(name => !!_modules[name]);
      for (const key in _modules) {
        const nextValid = validTestNames.includes(key);
        if (nextValid !== _modules[key].isActive) hasNewModules = true;
        _modules[key].isActive = nextValid;
      }
      console.log('new linked tests -> ', testNames, validTestNames, _modules);
    }

    if (Object.keys(_modules).length) {
      setModules(_modules);
      cacheModules(_modules);
    }

    if (hasNewModules) setNeedsNavigate(true);
  }

  // const link = useLinking();

  React.useEffect(() => {
    if (navigation && needsNavigate) {
      setNeedsNavigate(false);
      navigation.navigate('run');
    }
    // processLink(link);
  }, [navigation, needsNavigate]);

  // React.useEffect(() => {
  //   processLink(link);
  // }, [link, modules]);

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

  const onToggleAll = isActive => {
    if (isTesting) return;
    const _modules = { ...modules };

    let toggleDirection = isActive;
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
        setNavigation,
      }}>
      {children}
    </ModulesContext.Provider>
  );
}
