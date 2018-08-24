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
    let moduleSpecs = await _getExpoModuleSpecsAsync();
    let code = `module.exports = ${JSON.stringify(moduleSpecs)};`;
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
  let whitelist = /^(Expo(?:nent)?|AIR|Lottie|RN)(?![a-z])/;
  let moduleNames = await ExpoNativeModuleIntrospection.getNativeModuleNamesAsync();
  let expoModuleNames = moduleNames.filter(moduleName => whitelist.test(moduleName)).sort();
  let specPromises = {};
  for (let moduleName of expoModuleNames) {
    specPromises[moduleName] = _getModuleSpecAsync(moduleName, NativeModules[moduleName]);
  }
  return await mux(specPromises);
}

async function _getModuleSpecAsync(moduleName, module) {
  if (!module) {
    return {};
  }

  let moduleDescription = await ExpoNativeModuleIntrospection.introspectNativeModuleAsync(
    moduleName
  );
  let spec = _addFunctionTypes(_mockify(module), moduleDescription.methods);
  if (moduleName === 'ExpoNativeModuleProxy') {
    spec.exportedMethods.mock = module.exportedMethods;
    spec.viewManagersNames.mock = module.viewManagersNames;
    spec.modulesConstants.type = 'mock';
    spec.modulesConstants.mockDefinition = Object.keys(module.modulesConstants)
      .sort()
      .reduce(
        (spec, moduleName) => ({
          ...spec,
          [moduleName]: _mockify(module.modulesConstants[moduleName]),
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
      let value = obj[key];
      let type = Array.isArray(value) ? 'array' : typeof value;
      let mock = type !== 'function' ? _mockifyValue(value, { context, key }) : undefined;
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
