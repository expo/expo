import { requireNativeModule } from 'expo';
import { setStringAsync } from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

// const whitelist = /^(Expo(?:nent)?|AIR|CTK|Lottie|Reanimated|RN|NativeUnimoduleProxy)(?![a-z])/;
const blacklist = [
  'ExpoCrypto',
  'ExpoClipboard',
  'ExpoLocalization',
  'ExpoLinking',
  'ExpoFont',
  'ExpoFileSystem',
  'ExpoVideo',
];

type ModuleRegistrySchema = [
  {
    name: string;
    functions: [{ name: string; argumentsCount: number }];
    properties: [{ name: string }];
    constants: [[{ name: string; type: string; value: any }]];
    views: [{ name: string; props: [{ name: string }] }];
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
        line into{' '}
        <Text style={{ backgroundColor: '#eee' }}>jest-expo/src/moduleMocks/expoModules.js</Text>{' '}
        and format it nicely with prettier.
      </Text>
      <Button onPress={() => setStringAsync(moduleSpecs)} title="Copy to clipboard" />
    </View>
  );
}

async function _getExpoModuleSpecsAsync() {
  const schemaString = await CoreModule.getModulesSchema();
  const schema = JSON.parse(schemaString) as ModuleRegistrySchema;
  const methodsMock = Object.fromEntries(
    schema
      .filter((expoModule) => !blacklist.includes(expoModule.name))
      .map((m) => [m.name, m.functions.map((fn) => ({ ...fn, key: fn.name }))])
  );
  const constantsMock = Object.fromEntries(
    schema
      .filter((expoModule) => !blacklist.includes(expoModule.name))
      .map((m) => [
        m.name,
        {
          ...Object.fromEntries(m.properties.map((p) => [p.name, { type: 'property' }])),
          ...Object.fromEntries(m.functions.map((fn) => [fn.name, { type: 'function' }])),
          ...Object.fromEntries(
            (m.constants[0] ?? []).map((ct) =>
              ct.type !== 'string' && ct.value !== null
                ? [ct.name, { type: ct.type, mock: ct.value }]
                : [ct.name, { type: ct.type }]
            )
          ),
          addListener: { type: 'function' },
          removeListeners: { type: 'function' },
        },
      ])
  );

  const viewsMock = Object.fromEntries(
    schema
      .filter((m) => !blacklist.includes(m.name))
      // We break assumptions about multiple views from a single module due to original structure.
      .map(
        (m) =>
          [
            m.name,
            { propNames: [...new Set(m.views.flatMap((v) => v.props).map((p) => p.name))] },
          ] as const
      )
      .filter((m) => m[1].propNames.length > 0)
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
      viewManagersMetadata: {
        type: 'object',
        mock: viewsMock,
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
