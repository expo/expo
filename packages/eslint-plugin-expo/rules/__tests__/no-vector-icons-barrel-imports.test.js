const { RuleTester } = require('eslint');
const rule = require('../no-vector-icons-barrel-imports');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run('no-vector-icons-barrel-imports', rule, {
  valid: [
    {
      code: `import Ionicons from '@expo/vector-icons/Ionicons';`,
    },
    {
      code: `import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';`,
    },
  ],
  invalid: [
    {
      code: `import { Ionicons } from '@expo/vector-icons';`,
      errors: [{ message: `Import Ionicons directly to reduce app size` }],
      output: `import Ionicons from '@expo/vector-icons/Ionicons';`,
    },
    {
      code: `import { Ionicons, Entypo } from '@expo/vector-icons';`,
      errors: [{ message: `Import Ionicons and Entypo directly to reduce app size` }],
      output: `import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';`,
    },
    {
      code: `import '@expo/vector-icons';`,
      errors: [
        {
          message: `Avoid empty import of @expo/vector-icons. Specify the modules you want to import.`,
        },
      ],
      output: ``,
    },
    {
      code: `require('@expo/vector-icons');`,
      errors: [
        {
          message: `Avoid empty require of @expo/vector-icons. Specify the modules you want to require.`,
        },
      ],
      output: ``,
    },
    {
      code: `require('@expo/vector-icons')`,
      errors: [
        {
          message: `Avoid empty require of @expo/vector-icons. Specify the modules you want to require.`,
        },
      ],
      output: ``,
    },
  ],
});
