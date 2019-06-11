# babel-plugin-expo-vector-icons

> Inspired by `babel-plugin-react-native-web`

[![npm version][package-badge]][package-url] [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

# Why

When building a web project tree-shaking doesn't know how to exclude unused fonts (and possibly all assets). Even though the file importing them can be shaken out, the asset still gets bundled. I've constructed a babel-plugin to reassign all of the `@expo/vector-icon` imports but this won't matter if Expo is reexporting all of the fonts anyways.

# How

Removed the re-export of vector-icons. You will now have to import your fonts like so

```diff
- import { Icons } from 'expo';

+ import { Ionicons } from '@expo/vector-icons';
```

Which will then become a direct import after bundling:

```diff
- import { Ionicons } from '@expo/vector-icons';

+ import Ionicons from '@expo/vector-icons/build/Ionicons';
```

> This applies to native as well.

# Test Plan

In the future, running `expo build:web` will generate a project with only the font files you use and none of the extra fonts. Currently you get all of these bundled even if you never use fonts:

```
AntDesign.ttf
Entypo.ttf
Feather.ttf
FontAwesome.ttf
FontAwesome5_Brands.ttf
FontAwesome5_Solid.ttf
Foundation.ttf
Ionicons.ttf
MaterialCommunityIcons.ttf
MaterialIcons.ttf
SimpleLineIcons.ttf
```

# Installation

This plugin is included in `babel-preset-expo`.

```
yarn add --dev babel-plugin-expo-vector-icons
```

## Usage

**.babelrc**

```
{
  "plugins": [
    ["expo-vector-icons"]
  ]
}
```

[package-badge]: https://img.shields.io/npm/v/babel-plugin-expo-vector-icons.svg?style=flat
[package-url]: https://yarnpkg.com/en/package/babel-plugin-expo-vector-icons
