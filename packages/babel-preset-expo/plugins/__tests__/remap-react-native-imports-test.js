const plugin = require('../remap-react-native-imports');
const pluginTester = require('babel-plugin-tester').default;

const tests = [
  // import react-native
  {
    title: 'import from "native-native"',
    code: `import ReactNative from 'react-native';
import { View, Pressable, findNodeHandle } from 'react-native';
import { Invalid, View as MyView } from 'react-native';
import * as ReactNativeModules from 'react-native';`,
    snapshot: true,
  },
  {
    title: 'import from "native-native"',
    code: `import ReactNative from 'react-native';
import { View, Pressable, findNodeHandle } from 'react-native';
import { Invalid, View as MyView } from 'react-native';
import * as ReactNativeModules from 'react-native';`,
    snapshot: true,
    pluginOptions: { commonjs: true },
  },
  {
    title: 'export from "react-native"',
    code: `export { View, findNodeHandle } from 'react-native';
export { StyleSheet, Text } from 'react-native';`,
    snapshot: true,
  },
  {
    title: 'require "react-native"',
    code: `const ReactNative = require('react-native');
const { View, Pressable, findNodeHandle } = require('react-native');
const { StyleSheet, TouchableOpacity } = require('react-native');`,
    snapshot: true,
  },
  {
    title: 'require "react-native"',
    code: `const ReactNative = require('react-native');
const { View, Pressable, findNodeHandle } = require('react-native');
const { StyleSheet, TouchableOpacity } = require('react-native');`,
    snapshot: true,
    pluginOptions: { commonjs: true },
  },
];

pluginTester({
  babelOptions: {
    generatorOpts: {
      jsescOption: {
        quotes: 'single',
      },
    },
  },
  plugin,
  pluginName: 'Rewrite react-native to internal imports',
  tests,
});
