import { transformSync } from '@babel/core';

import expoUiPlugin from '../babel-plugin';

function transform(input: string, platform?: 'ios' | 'android' | 'web'): string {
  const result = transformSync(input, {
    babelrc: false,
    configFile: false,
    plugins: [expoUiPlugin],
    parserOpts: { sourceType: 'module' },
    generatorOpts: { compact: false, retainLines: false },
    caller: platform ? ({ name: 'test', platform } as any) : undefined,
  });
  return (result?.code ?? '').trim();
}

describe('expo-ui babel plugin', () => {
  it('should rewrite Icon.select into a Platform.OS ternary', () => {
    expect(
      transform(`
import { Icon } from '@expo/ui';
const HEART = Icon.select({
  ios: 'heart.fill',
  android: require('@expo/material-symbols/favorite.xml'),
});
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const HEART = process.env.EXPO_OS === "ios" ? 'heart.fill' : process.env.EXPO_OS === "android" ? require('@expo/material-symbols/favorite.xml') : undefined;"
    `);
  });

  it('should leave unrelated imports alone', () => {
    expect(
      transform(`
import { Icon } from '@expo/ui';
import { Platform } from 'react-native';
console.log(Platform.OS);
const HEART = Icon.select({ ios: 'heart.fill', android: 1 });
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      import { Platform } from 'react-native';
      console.log(Platform.OS);
      const HEART = process.env.EXPO_OS === "ios" ? 'heart.fill' : process.env.EXPO_OS === "android" ? 1 : undefined;"
    `);
  });

  it('should handle a renamed Icon import binding', () => {
    expect(
      transform(`
import { Icon as ExpoIcon } from '@expo/ui';
const HEART = ExpoIcon.select({ ios: 'heart.fill', android: 1 });
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon as ExpoIcon } from '@expo/ui';
      const HEART = process.env.EXPO_OS === "ios" ? 'heart.fill' : process.env.EXPO_OS === "android" ? 1 : undefined;"
    `);
  });

  it('should rewrite Icon.select reached through a namespace import', () => {
    expect(
      transform(`
import * as ExpoUI from '@expo/ui';
const HEART = ExpoUI.Icon.select({
  ios: 'heart.fill',
  android: import('@expo/material-symbols/favorite.xml'),
});
      `)
    ).toMatchInlineSnapshot(`
      "import * as ExpoUI from '@expo/ui';
      const HEART = process.env.EXPO_OS === "ios" ? 'heart.fill' : process.env.EXPO_OS === "android" ? require('@expo/material-symbols/favorite.xml') : undefined;"
    `);
  });

  it('should leave namespace Icon.select alone when the namespace points at another module', () => {
    expect(
      transform(`
import * as Other from 'other-package';
const HEART = Other.Icon.select({ ios: 'heart.fill', android: 1 });
      `)
    ).toMatchInlineSnapshot(`
      "import * as Other from 'other-package';
      const HEART = Other.Icon.select({
        ios: 'heart.fill',
        android: 1
      });"
    `);
  });

  it('should leave Icon.select alone when Icon is imported from another module', () => {
    expect(
      transform(`
import { Icon } from 'other-package';
const HEART = Icon.select({ ios: 'heart.fill', android: 1 });
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon } from 'other-package';
      const HEART = Icon.select({
        ios: 'heart.fill',
        android: 1
      });"
    `);
  });

  it('should leave non-Icon select calls alone', () => {
    expect(
      transform(`
import { Platform } from 'react-native';
const v = Platform.select({ ios: 1, android: 2 });
      `)
    ).toMatchInlineSnapshot(`
      "import { Platform } from 'react-native';
      const v = Platform.select({
        ios: 1,
        android: 2
      });"
    `);
  });

  it('should leave Icon.select alone when the argument is not a static object', () => {
    expect(
      transform(`
import { Icon } from '@expo/ui';
const spec = { ios: 'heart.fill', android: 1 };
const HEART = Icon.select(spec);
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const spec = {
        ios: 'heart.fill',
        android: 1
      };
      const HEART = Icon.select(spec);"
    `);
  });

  it('should leave Icon.select alone when ios or android keys are missing', () => {
    expect(
      transform(`
import { Icon } from '@expo/ui';
const HEART = Icon.select({ ios: 'heart.fill' });
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const HEART = Icon.select({
        ios: 'heart.fill'
      });"
    `);
  });

  it('should rewrite a literal-string import() inside Icon.select to require()', () => {
    expect(
      transform(`
import { Icon } from '@expo/ui';
const STAR = Icon.select({
  ios: 'star.fill',
  android: import('@expo/material-symbols/star.xml'),
});
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const STAR = process.env.EXPO_OS === "ios" ? 'star.fill' : process.env.EXPO_OS === "android" ? require('@expo/material-symbols/star.xml') : undefined;"
    `);
  });

  it('should leave dynamic import() outside Icon.select alone', () => {
    expect(
      transform(`
const lazy = () => import('./other-module');
      `)
    ).toMatchInlineSnapshot(`"const lazy = () => import('./other-module');"`);
  });

  it('should leave non-literal import() inside Icon.select alone', () => {
    // Computed path can't tree-shake — the plugin leaves it alone and emits
    // the Platform.OS ternary around the original import() call.
    expect(
      transform(`
import { Icon } from '@expo/ui';
const path = '@expo/material-symbols/star.xml';
const STAR = Icon.select({
  ios: 'star.fill',
  android: import(path),
});
      `)
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const path = '@expo/material-symbols/star.xml';
      const STAR = process.env.EXPO_OS === "ios" ? 'star.fill' : process.env.EXPO_OS === "android" ? import(path) : undefined;"
    `);
  });

  it('should emit only the iOS branch when platform is ios', () => {
    expect(
      transform(
        `
import { Icon } from '@expo/ui';
const STAR = Icon.select({
  ios: 'star.fill',
  android: require('@expo/material-symbols/star.xml'),
});
      `,
        'ios'
      )
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const STAR = 'star.fill';"
    `);
  });

  it('should emit only the Android branch when platform is android', () => {
    expect(
      transform(
        `
import { Icon } from '@expo/ui';
const STAR = Icon.select({
  ios: 'star.fill',
  android: import('@expo/material-symbols/star.xml'),
});
      `,
        'android'
      )
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const STAR = require('@expo/material-symbols/star.xml');"
    `);
  });

  it('should emit only the iOS branch for namespace imports when platform is ios', () => {
    expect(
      transform(
        `
import * as ExpoUI from '@expo/ui';
const STAR = ExpoUI.Icon.select({
  ios: 'star.fill',
  android: import('@expo/material-symbols/star.xml'),
});
      `,
        'ios'
      )
    ).toMatchInlineSnapshot(`
      "import * as ExpoUI from '@expo/ui';
      const STAR = 'star.fill';"
    `);
  });

  it('should emit only the Android branch for namespace imports when platform is android', () => {
    expect(
      transform(
        `
import * as ExpoUI from '@expo/ui';
const STAR = ExpoUI.Icon.select({
  ios: 'star.fill',
  android: import('@expo/material-symbols/star.xml'),
});
      `,
        'android'
      )
    ).toMatchInlineSnapshot(`
      "import * as ExpoUI from '@expo/ui';
      const STAR = require('@expo/material-symbols/star.xml');"
    `);
  });

  it('should emit `undefined` for web (web Icon is a no-op so the value is unused)', () => {
    expect(
      transform(
        `
import { Icon } from '@expo/ui';
const STAR = Icon.select({
  ios: 'star.fill',
  android: require('@expo/material-symbols/star.xml'),
});
      `,
        'web'
      )
    ).toMatchInlineSnapshot(`
      "import { Icon } from '@expo/ui';
      const STAR = undefined;"
    `);
  });
});
