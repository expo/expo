import mux from '@expo/mux';
import { getNativeModuleIfExists } from 'expo';
import Constants from 'expo-constants';
import getInstallationIdAsync from 'expo/build/environment/getInstallationIdAsync';
import React from 'react';
import { NativeModules, StyleSheet, Text, View } from 'react-native';
import { v4 as uuidV4 } from 'uuid';

const logUrl = Constants.manifest.logUrl;
const sessionId = uuidV4();

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

    const message = `

------------------------------COPY THE TEXT BELOW------------------------------

${code}

------------------------------END OF TEXT TO COPY------------------------------

`;
    await _sendRawLogAsync(message, logUrl);
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

/**
 * Sends a log message without truncating it.
 */
async function _sendRawLogAsync(message, logUrl) {
  const headers = {
    'Content-Type': 'application/json',
    Connection: 'keep-alive',
    'Proxy-Connection': 'keep-alive',
    Accept: 'application/json',
    'Device-Id': await getInstallationIdAsync(),
    'Session-Id': sessionId,
  };
  if (Constants.deviceName) {
    headers['Device-Name'] = Constants.deviceName;
  }
  await fetch(logUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify([
      {
        count: 0,
        level: 'info',
        body: [message],
        includesStack: false,
      },
    ]),
  });
}

async function _getExpoModuleSpecsAsync() {
  const whitelist = /^(Expo(?:nent)?|AIR|CTK|Lottie|Reanimated|RN|NativeUnimoduleProxy)(?![a-z])/;
  const moduleNames = await ExpoNativeModuleIntrospection.getNativeModuleNamesAsync();
  const expoModuleNames = moduleNames.filter((moduleName) => whitelist.test(moduleName)).sort();
  const specPromises = {};
  for (const moduleName of expoModuleNames) {
    specPromises[moduleName] = _getModuleSpecAsync(moduleName, getNativeModuleIfExists(moduleName));
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
    spec.viewManagersMetadata.mock = module.viewManagersMetadata;
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

const _sortObject = (obj) =>
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
