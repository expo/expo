const { RuleTester } = require('eslint');
const rule = require('../modern-react-native');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run('no-rn-image-imports', rule, {
  valid: [
    {
      code: `import { Image } from 'expo-image';`,
    },
    {
      code: `import Ionicons from '@expo/vector-icons/Ionicons';`,
    },
    {
      code: `import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';`,
    },
    {
      code: `import { ScrollView, FlatList } from 'react-native-gesture-handler';`,
    },
    {
      code: `import { StatusBar } from 'expo-status-bar';`,
    },
    {
      code: `import * as Linking from 'expo-linking';`,
    },
    // Supports options
    {
      code: `import { Image } from 'react-native';`,
      options: [
        {
          preserve: ['Image'],
        },
      ],
    },
  ],
  invalid: [
    {
      code: `import { Image } from 'react-native';
import { Other } from 'expo-image';`,
      errors: [{ message: `Import Image from 'expo-image' instead of 'react-native'` }],
      output: `
import { Other, Image } from 'expo-image';`,
    },
    {
      code: `import { Image } from 'react-native';`,
      errors: [{ message: `Import Image from 'expo-image' instead of 'react-native'` }],
      output: `import { Image } from 'expo-image';
`,
    },
    {
      code: `import { Image, View } from 'react-native';`,
      errors: [{ message: `Import Image from 'expo-image' instead of 'react-native'` }],
      output: `import { Image } from 'expo-image';
import { View } from 'react-native';`,
    },
    {
      code: `import { ScrollView, Image } from 'react-native';`,
      errors: [
        {
          message: `Import ScrollView and Image from 'react-native-gesture-handler' and 'expo-image' instead of 'react-native'`,
        },
      ],
      output: `import { ScrollView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
`,
    },

    {
      code: `import { View, ScrollView, Image } from 'react-native';`,
      options: [
        {
          preserve: ['Image'],
        },
      ],
      errors: [
        {
          message: `Import ScrollView from 'react-native-gesture-handler' instead of 'react-native'`,
        },
      ],
      output: `import { ScrollView } from 'react-native-gesture-handler';
import { View, Image } from 'react-native';`,
    },
  ],
});
