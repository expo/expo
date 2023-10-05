import mux from '@expo/mux';
import { setStringAsync } from 'expo-clipboard';
import React from 'react';
import { Button, NativeModules, StyleSheet, Text, View } from 'react-native';

// A workaround for `TypeError: Cannot read property 'now' of undefined` error thrown from reanimated code.
global.performance = {
  now: () => 0,
};

const { ExpoNativeModuleIntrospection } = NativeModules;

if (!ExpoNativeModuleIntrospection) {
  console.warn(
    'Looks like there is no `ExpoNativeModuleIntrospection` module. Please make sure you are running this app on iOS.'
  );
}

const keysOrder = ['type', 'functionType', 'name', 'argumentsCount', 'key'];

function isNumeric(str) {
  if (typeof str !== 'string') {
    return false; // we only process strings!
  }
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

const replacer = (_key, value) => {
  if (value instanceof Object && !(value instanceof Array)) {
    return Object.keys(value)
      .sort(function (a, b) {
        if (keysOrder.indexOf(a) !== -1 || keysOrder.indexOf(b) !== -1) {
          return (
            (keysOrder.includes(a) ? keysOrder.indexOf(a) : Infinity) -
            (keysOrder.includes(b) ? keysOrder.indexOf(b) : Infinity)
          );
        } else {
          return a.localeCompare(b);
        }
      })
      .reduce((sorted, key) => {
        sorted[key] = value[key];
        return sorted;
      }, {});
  }
  if (value instanceof Array) {
    // sorts by numeric keys eg. { name: 'isAvailableAsync', argumentsCount: 0, key: 0 },
    if (value?.[0]?.key && isNumeric(value?.[0]?.key)) {
      return value.sort((a, b) => Number(a?.key) > Number(b?.key));
    }
    // sorts by string keys  eg. { name: 'getNetworkStateAsync', argumentsCount: 0, key: 'getNetworkStateAsync' },
    if (value?.[0]?.key) {
      return value.sort((a, b) => a?.key?.localeCompare?.(b?.key));
    }
    // sort other arrays
    return value?.sort((a, b) => a?.localeCompare?.(b)) ?? value;
  }
  return value;
};

export default class App extends React.Component {
  state = {};

  async componentDidMount() {
    const moduleSpecs = await _getExpoModuleSpecsAsync();
    const code = `module.exports = ${JSON.stringify(moduleSpecs, replacer)};`;
    await setStringAsync(code);
    this.setState({ moduleSpecs: code });
    const message = `

------------------------------COPY THE TEXT BELOW------------------------------

${code}

------------------------------END OF TEXT TO COPY------------------------------

THE TEXT WAS ALSO COPIED TO YOUR CLIPBOARD

`;
    console.log(message);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={{ fontWeight: '700' }}>
          Your new jest mocks should now be:{'\n'}- In your clipboard{'\n'}- In your development
          console.{'\n\n'}
          Copy either one of the <Text style={{ backgroundColor: '#eee' }}>
            module.exports
          </Text>{' '}
          line into <Text style={{ backgroundColor: '#eee' }}>jest-expo/src/expoModules.js</Text>{' '}
          and format it nicely with prettier.
        </Text>
        <Button onPress={() => setStringAsync(this.state.moduleSpecs)} title="Copy to clipboard" />
      </View>
    );
  }
}

const whitelist = /^(Expo(?:nent)?|AIR|CTK|Lottie|Reanimated|RN|NativeUnimoduleProxy)(?![a-z])/;
const blacklist = ['ExpoCrypto'];
async function _getExpoModuleSpecsAsync() {
  const moduleNames = await ExpoNativeModuleIntrospection.getNativeModuleNamesAsync();
  const expoModuleNames = moduleNames.filter((moduleName) => whitelist.test(moduleName)).sort();
  const specPromises = {};
  for (const moduleName of expoModuleNames) {
    specPromises[moduleName] = _getModuleSpecAsync(moduleName, NativeModules[moduleName]);
  }
  return await mux(specPromises);
}

async function _getModuleSpecAsync(moduleName, module) {
  if (!module) {
    return {};
  }

  const moduleDescription =
    await ExpoNativeModuleIntrospection.introspectNativeModuleAsync(moduleName);
  const spec = _addFunctionTypes(_mockify(module), moduleDescription.methods);
  if (moduleName === 'NativeUnimoduleProxy') {
    spec.exportedMethods.mock = _sortObjectAndBlacklistKeys(module.exportedMethods, blacklist);
    spec.viewManagersMetadata.mock = module.viewManagersMetadata;
    spec.modulesConstants.type = 'mock';

    spec.modulesConstants.mockDefinition = Object.keys(module.modulesConstants)
      .sort()
      .filter((name) => !blacklist.includes(name))
      .reduce(
        (spec, moduleName) => ({
          ...spec,
          [moduleName]: module.modulesConstants[moduleName]
            ? _mockify(module.modulesConstants[moduleName])
            : undefined,
        }),
        {}
      );
  }
  return spec;
}

const _mockify = (obj, context) =>
  Object.keys(obj)
    .sort()
    .reduce((spec, key) => {
      const value = obj[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      const mock = type !== 'function' ? _mockifyValue(value, { context, key }) : undefined;
      return { ...spec, [key]: { type, mock } };
    }, {});

const _addFunctionTypes = (spec, methods) =>
  Object.keys(methods)
    .sort()
    .reduce(
      (spec, methodName) => ({
        ...spec,
        [methodName]: {
          ...spec[methodName],
          functionType: methods[methodName].type,
        },
      }),
      spec
    );

const _sortObjectAndBlacklistKeys = (obj, blacklist) =>
  Object.keys(obj)
    .sort()
    .filter((k) => !blacklist.includes(k))
    .reduce(
      (acc, el) => ({
        ...acc,
        [el]: obj[el],
      }),
      {}
    );

function _mockifyValue(value) {
  // Include only values that generally don't contain sensitive data
  return value === null || typeof value === 'boolean' || typeof value === 'number'
    ? value
    : undefined;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
