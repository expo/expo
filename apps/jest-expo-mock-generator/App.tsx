import { requireNativeModule } from 'expo';
import { setStringAsync } from 'expo-clipboard';
import { addListener } from 'expo-keep-awake';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

type ModuleRegistrySchema = [
  {
    name: string;
    functions: [{ name: string; argumentsCount: number }];
    properties: [{ name: string }];
    constants: [[{ name: string; type: string; value: any }]]; // TODO: Fix
  },
];

const CoreModule = requireNativeModule('ExpoGo');

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
      return value.sort((a, b) => Number(a?.key) - Number(b?.key));
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

export default function App() {
  const [moduleSpecs, setModuleSpecs] = useState('');

  useEffect(() => {
    const fetchModuleSpecs = async () => {
      try {
        const moduleSpecs = await _getExpoModuleSpecsAsync();
        const code = `module.exports = ${JSON.stringify(moduleSpecs, replacer)};`;
        await setStringAsync(code);
        setModuleSpecs(code);
      } catch (error) {
        console.error('Error fetching module specs:', error);
      }
    };

    fetchModuleSpecs();
  }, []);

  useEffect(() => {
    if (moduleSpecs.length) {
      const message = `

------------------------------COPY THE TEXT BELOW------------------------------

${moduleSpecs}

------------------------------END OF TEXT TO COPY------------------------------

THE TEXT WAS ALSO COPIED TO YOUR CLIPBOARD

`;
      console.log(message);
    }
  }, [moduleSpecs]);

  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: '700' }}>
        Your new jest mocks should now be:{'\n'}- In your clipboard{'\n'}- In your development
        console.{'\n\n'}
        Copy either one of the <Text style={{ backgroundColor: '#eee' }}>module.exports</Text> line
        line into <Text style={{ backgroundColor: '#eee' }}>jest-expo/src/expoModules.js</Text> and
        format it nicely with prettier.
      </Text>
      <Button onPress={() => setStringAsync(moduleSpecs)} title="Copy to clipboard" />
    </View>
  );
}

// const whitelist = /^(Expo(?:nent)?|AIR|CTK|Lottie|Reanimated|RN|NativeUnimoduleProxy)(?![a-z])/;
const blacklist = ['ExpoCrypto', 'ExpoClipboard'];

async function _getExpoModuleSpecsAsync() {
  const schemaString = await CoreModule.getModulesSchema();
  const schema = JSON.parse(schemaString) as ModuleRegistrySchema;
  const methodsMock = Object.fromEntries(
    schema
      .filter((module) => !blacklist.includes(module.name))
      .map((module) => [module.name, module.functions.map((fn) => ({ ...fn, key: fn.name }))])
  );
  const constantsMock = Object.fromEntries(
    schema
      .filter((module) => !blacklist.includes(module.name))
      .map((module) => [
        module.name,
        {
          ...Object.fromEntries(module.properties.map((p) => [p.name, { type: 'property' }])),
          ...Object.fromEntries(module.functions.map((fn) => [fn.name, { type: 'function' }])),
          ...Object.fromEntries(
            (module.constants[0] ?? []).map((ct) =>
              ct.type !== 'string'
                ? [ct.name, { type: ct.type, mock: ct.value }]
                : [ct.name, { type: ct.type }]
            )
          ),
          addListener: { type: 'function' },
          removeListeners: { type: 'function' },
        },
      ])
  );

  return {
    NativeUnimoduleProxy: {
      callMethod: { type: 'function', functionType: 'promise' },
      exportedMethods: {
        type: 'object',
        mock: methodsMock,
      },
      getConstants: { type: 'function' },
      modulesConstants: {
        type: 'mock',
        mockDefinition: constantsMock,
      },
    },
  };
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
