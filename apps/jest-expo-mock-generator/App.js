import mux from '@expo/mux';
import React from 'react';
import { NativeModules, StyleSheet, Text, View } from 'react-native';

const { ExpoNativeModuleIntrospection } = NativeModules;

if (!ExpoNativeModuleIntrospection) {
  console.warn(
    'Looks like there is no `ExpoNativeModuleIntrospection` module. Please make sure you are running this app on iOS.'
  );
}

export default class App extends React.Component {
  async componentDidMount() {
    const moduleSpecs = await _getExpoModuleSpecsAsync();
    const code = `module.exports = ${JSON.stringify(moduleSpecs)};`;
    console.log('\n');
    console.log('------------------------------COPY THE TEXT BELOW------------------------------');
    console.log('\n');
    console.log(code);
    console.log('\n');
    console.log('------------------------------END OF TEXT TO COPY------------------------------');
    console.log('\n');
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>
          Check your console and copy the relevant logs into jest-expo/src/expoModules.js and format
          it nicely with prettier
        </Text>
      </View>
    );
  }
}

async function _getExpoModuleSpecsAsync() {
  const whitelist = /^(Expo(?:nent)?|AIR|CTK|Lottie|Reanimated|RN|NativeUnimoduleProxy)(?![a-z])/;
  const moduleNames = await ExpoNativeModuleIntrospection.getNativeModuleNamesAsync();
  const expoModuleNames = moduleNames.filter(moduleName => whitelist.test(moduleName)).sort();
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

  const moduleDescription = await ExpoNativeModuleIntrospection.introspectNativeModuleAsync(
    moduleName
  );
  const spec = _addFunctionTypes(_mockify(module), moduleDescription.methods);
  if (moduleName === 'NativeUnimoduleProxy') {
    spec.exportedMethods.mock = _sortObject(module.exportedMethods);
    spec.viewManagersNames.mock = module.viewManagersNames.sort();
    spec.modulesConstants.type = 'mock';
    spec.modulesConstants.mockDefinition = Object.keys(module.modulesConstants)
      .sort()
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

const _sortObject = obj =>
  Object.keys(obj)
    .sort()
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
