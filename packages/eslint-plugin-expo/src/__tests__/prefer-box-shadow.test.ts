import { RuleTester } from '@typescript-eslint/rule-tester';

import { preferBoxShadow } from '../rules/prefer-box-shadow';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('prefer-box-shadow', preferBoxShadow, {
  valid: [
    {
      code: `
        const styles = StyleSheet.create({
          container: {
            backgroundColor: 'white',
            padding: 10,
            boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
          },
        });
      `,
    },
    {
      code: `
        const styles = {
          container: {
            backgroundColor: 'white',
            padding: 10,
            boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
          },
        };
      `,
    },
    {
      code: `
        <View style={{
          backgroundColor: 'white',
          padding: 10,
          boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
        }} />
      `,
    },
  ],
  invalid: [
    {
      code: `
        const styles = StyleSheet.create({
          container: {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowOpacity: 0.33,
            shadowRadius: 3,
            elevation: 8,
          },
        });
      `,
      errors: [
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
      ],
    },
    {
      code: `
        <View style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }} />
      `,
      errors: [
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
        { messageId: 'preferBoxShadow' },
      ],
    },
    {
      code: `
        const styles = {
          card: {
            shadowColor: '#000',
            elevation: 3,
          },
        };
      `,
      errors: [{ messageId: 'preferBoxShadow' }, { messageId: 'preferBoxShadow' }],
    },
  ],
});
