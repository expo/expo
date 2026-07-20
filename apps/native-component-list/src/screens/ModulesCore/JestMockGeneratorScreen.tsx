import { requireOptionalNativeModule } from 'expo';
import { setStringAsync } from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

type JestMockSchemaModule = { getModulesSchema(): string };

const JestMockSchema = requireOptionalNativeModule<JestMockSchemaModule>('JestMockSchemaModule');

const blacklist = [
  // Modules with hand-written mocks in jest-expo.
  'ExpoCrypto',
  'ExpoClipboard',
  'ExpoLocalization',
  'ExpoLinking',
  'ExpoFont',
  'ExpoFileSystem',
  // bare-expo's own local test modules — not part of the public SDK.
  'JestMockSchemaModule',
  'TestExpoUi',
  'WorkletsTesterModule',
  'ExpoVideoDashSupportModule',
  'ExpoDevMenu',
  'ExpoDevLauncher',
  'DevMenuPreferences',
];

// Skip blacklisted modules and any anonymous module the registry reflects with an empty name.
function isIncludedModule(m: { name: string }) {
  return m.name.trim() !== '' && !blacklist.includes(m.name);
}

type ModuleRegistrySchema = {
  name: string;
  functions: { name: string; argumentsCount: number }[];
  properties: { name: string }[];
  constants: { name: string; type: string; value: any }[][];
  views: { name: string; props: { name: string }[] }[];
}[];

const keysOrder = ['type', 'functionType', 'name', 'argumentsCount', 'key'];

function isNumeric(str: unknown) {
  if (typeof str !== 'string') {
    return false;
  }
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}

const replacer = (_key: string, value: any) => {
  if (value instanceof Object && !(value instanceof Array)) {
    return Object.keys(value)
      .sort((a, b) => {
        if (keysOrder.indexOf(a) !== -1 || keysOrder.indexOf(b) !== -1) {
          return (
            (keysOrder.includes(a) ? keysOrder.indexOf(a) : Infinity) -
            (keysOrder.includes(b) ? keysOrder.indexOf(b) : Infinity)
          );
        }
        return a.localeCompare(b);
      })
      .reduce((sorted: Record<string, any>, key) => {
        sorted[key] = value[key];
        return sorted;
      }, {});
  }
  if (value instanceof Array) {
    if (value?.[0]?.key && isNumeric(value?.[0]?.key)) {
      return value.sort((a, b) => Number(a?.key) - Number(b?.key));
    }
    if (value?.[0]?.key) {
      return value.sort((a, b) => a?.key?.localeCompare?.(b?.key));
    }
    return value?.sort((a, b) => a?.localeCompare?.(b)) ?? value;
  }
  return value;
};

function getExpoModuleSpecs() {
  if (!JestMockSchema) {
    throw new Error(
      'JestMockSchemaModule is unavailable. Run this screen inside a bare dev build such as bare-expo.'
    );
  }
  const schema = JSON.parse(JestMockSchema.getModulesSchema()) as ModuleRegistrySchema;

  const methodsMock = Object.fromEntries(
    schema
      .filter(isIncludedModule)
      .map((m) => [m.name, m.functions.map((fn) => ({ ...fn, key: fn.name }))])
  );
  const constantsMock = Object.fromEntries(
    schema.filter(isIncludedModule).map((m) => [
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
      .filter(isIncludedModule)
      .map(
        (m) =>
          [
            m.name,
            {
              propNames: [...new Set(m.views.flatMap((v) => v.props).map((p) => p.name))],
            },
          ] as const
      )
      .filter((m) => m[1].propNames.length > 0)
  );

  return {
    NativeUnimoduleProxy: {
      callMethod: { type: 'function', functionType: 'promise' },
      exportedMethods: { type: 'object', mock: methodsMock },
      getConstants: { type: 'function' },
      modulesConstants: { type: 'mock', mockDefinition: constantsMock },
      viewManagersMetadata: { type: 'object', mock: viewsMock },
    },
  };
}

export default function JestMockGeneratorScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const generated = `module.exports = ${JSON.stringify(getExpoModuleSpecs(), replacer)};`;
      setCode(generated);
      setStringAsync(generated);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        Copied to your clipboard. Paste over
        packages/jest-expo/src/preset/moduleMocks/expoModules.js, then run prettier.
      </Text>
      <Button title="Copy to clipboard again" onPress={() => setStringAsync(code)} />
      <ScrollView style={styles.output}>
        <Text selectable style={styles.mono}>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  instructions: { fontWeight: '600', marginBottom: 12 },
  error: { color: 'red' },
  output: { flex: 1, marginTop: 12 },
  mono: { fontFamily: 'Courier', fontSize: 10 },
});
