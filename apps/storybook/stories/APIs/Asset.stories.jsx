import React from 'react';

import { AppText, Code, DocFunctionItem, DocItem, Section } from '../ui-explorer';

export const title = 'Asset';
export const packageJson = require('expo-asset/package.json');
export const description = (
  <>
    This module provides an interface to Expo's asset system. An asset is any file that lives
    alongside the source code of your app that the app needs at runtime. Examples include images,
    fonts and sounds. Expo's asset system integrates with React Native's, so that you can refer to
    files with <Code>require('path/to/file')</Code>. This is how you refer to static image files in
    React Native for use in an <Code>Image</Code> component, for example. Check out React Native's
    <AppText
      accessibilityTraits="link"
      href="https://facebook.github.io/react-native/docs/images.html#static-image-resources"
      style={{ color: '#1B95E0' }}
      target="_blank">
      documentation on static image resources
    </AppText>
    for more information. This method of referring to static image resources works out of the box
    with Expo.
  </>
);
export const component = () => (
  <Section>
    <DocItem
      name="Importing the module"
      example={{
        code: `import { Asset } from 'expo-asset';`,
      }}
    />

    <DocFunctionItem
      name="loadAsync"
      typeInfo="Asset.loadAsync(modules: number | number[]): Promise<void[]>"
      description="A helper that wraps `Asset.fromModule(module).downloadAsync` for convenience."
      parameters={[
        {
          name: 'modules',
          type: ['number', 'number[]'],
          description: `An array of \`require('path/to/file')\`. Can also be just one module without an Array.`,
        },
      ]}
      returns={[
        {
          type: 'Promise',
          description: 'Resolves when the asset has been saved to disk.',
        },
      ]}
      example={{
        code: `await Asset.loadAsync(require('./image.png'));`,
      }}
    />

    <DocItem
      name="Asset.loadAsync(modules)"
      typeInfo="number[] | number"
      description="A helper that wraps `Asset.fromModule(module).downloadAsync` for convenience."
      example={{
        code: `const imageURI = Asset.fromModule(require('./images/hello.jpg')).uri;`,
      }}
    />

    <DocItem
      name="Asset.fromModule(module)"
      description="Returns the `Asset` instance representing an asset given its module."
      example={{
        code: `const imageURI = Asset.fromModule(require('./images/hello.jpg')).uri;`,
      }}
    />
  </Section>
);
