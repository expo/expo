const plugin = require('..');
const pluginTester = require('babel-plugin-tester');

const tests = [
  // import react-native
  {
    title: 'import from "@expo/vector-icons"',
    code: `import ReactNative from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Invalid, FontAwesome as MyFont, MaterialIcons } from '@expo/vector-icons';
import * as AllFonts from '@expo/vector-icons';`,
    snapshot: true,
  },
  {
    title: 'import from "@expo/vector-icons"',
    code: `import Fonts from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { Invalid, Ionicons as MyFont, MaterialCommunityIcons } from '@expo/vector-icons';
import * as AllFonts from '@expo/vector-icons';`,
    snapshot: true,
    pluginOptions: { commonjs: true },
  },
  {
    title: 'import from "react-native-vector-icons"',
    code: `import { createIconSetFromFontello } from 'react-native-vector-icons';
import { EvilIcons, Feather, FontAwesome, createIconSetFromIcoMoon } from 'react-native-vector-icons';
import * as AllFonts from 'react-native-vector-icons';`,
    snapshot: true,
  },
  {
    title: 'export from "@expo/vector-icons"',
    code: `export { FontAwesome } from '@expo/vector-icons';
export { EvilIcons, Feather, Ionicons, createIconSetFromFontello } from '@expo/vector-icons';`,
    snapshot: true,
  },
  {
    title: 'export from "react-native-vector-icons"',
    code: `export { Ionicons } from 'react-native-vector-icons';
export { EvilIcons, Feather, FontAwesome, createIconSetFromFontello } from 'react-native-vector-icons';`,
    snapshot: true,
  },
  {
    title: 'require "@expo/vector-icons"',
    code: `const Fonts = require('@expo/vector-icons');
const { FontAwesome5 } = require('@expo/vector-icons');
const { EvilIcons, Feather } = require('@expo/vector-icons');`,
    snapshot: true,
  },
  {
    title: 'require "@expo/vector-icons"',
    code: `const Fonts = require('@expo/vector-icons');
const { Foundation } = require('@expo/vector-icons');
const { FontAwesome5, AntDesign } = require('@expo/vector-icons');`,
    snapshot: true,
    pluginOptions: { commonjs: true },
  },
  {
    title: 'require "react-native-vector-icons"',
    code: `const Fonts = require('react-native-vector-icons');
const { FontAwesome5 } = require('react-native-vector-icons');
const { FontAwesome, AntDesign, EvilIcons, Ionicons, createIconSetFromFontello } = require('react-native-vector-icons');`,
    snapshot: true,
  },
];

pluginTester({
  plugin,
  tests,
});
