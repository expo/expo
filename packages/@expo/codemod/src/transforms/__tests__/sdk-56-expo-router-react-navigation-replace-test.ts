import { applyTransform } from 'jscodeshift/dist/testUtils';

import transform from '../sdk-56-expo-router-react-navigation-replace';

// Default parser (babel): covers plain JS and syntactically-unambiguous TS.
const run = (source: string): string =>
  applyTransform(transform, {}, { source, path: 'this/is/test.tsx' });

// tsx parser: required for TypeScript-specific syntax like `import type`
// declarations and inline `type` modifiers.
const runTS = (source: string): string =>
  applyTransform(transform, {}, { source }, { parser: 'tsx' });

describe('basic replacements', () => {
  test.each([
    '@react-navigation/native',
    '@react-navigation/core',
    '@react-navigation/elements',
    '@react-navigation/routers',
  ])('replaces %s with expo-router', (rnImport) => {
    const output = run(`import { NavigationContainer } from '${rnImport}';`);
    expect(output).toBe(`import { NavigationContainer } from "expo-router";`);
  });

  test('replaces @react-navigation/stack with expo-router/js-stack', () => {
    const output = run(`import { createStackNavigator } from '@react-navigation/stack';`);
    expect(output).toBe(`import { createStackNavigator } from "expo-router/js-stack";`);
  });

  test('replaces @react-navigation/bottom-tabs with expo-router/js-tabs', () => {
    const output = run(`import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';`);
    expect(output).toBe(`import { createBottomTabNavigator } from "expo-router/js-tabs";`);
  });

  test('replaces @react-navigation/material-top-tabs with expo-router/js-top-tabs', () => {
    const output = run(
      `import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';`
    );
    expect(output).toBe(`import { createMaterialTopTabNavigator } from "expo-router/js-top-tabs";`);
  });

  test('handles multiple specifiers from the same react-navigation package', () => {
    const output = run(
      `import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';`
    );
    expect(output).toBe(`import { useNavigation, useRoute, useFocusEffect } from "expo-router";`);
  });

  test('replaces all four react-navigation packages in one file', () => {
    const input = [
      `import { NavigationContainer } from '@react-navigation/native';`,
      `import { createStackNavigator } from '@react-navigation/stack';`,
      `import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';`,
      `import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';`,
    ].join('\n');
    const output = run(input);
    expect(output).toContain(`import { NavigationContainer } from "expo-router"`);
    expect(output).toContain(`import { createStackNavigator } from "expo-router/js-stack"`);
    expect(output).toContain(`import { createBottomTabNavigator } from "expo-router/js-tabs"`);
    expect(output).toContain(
      `import { createMaterialTopTabNavigator } from "expo-router/js-top-tabs"`
    );
    expect(output).not.toContain(`@react-navigation`);
  });

  test('leaves unrelated imports untouched', () => {
    // applyTransform returns empty string when transform returns undefined (no changes)
    const output = run(`import React from 'react';`);
    expect(output).toBe(``);
  });

  test('handles mixed related and unrelated imports', () => {
    const input = [
      `import React from 'react';`,
      `import { NavigationContainer } from '@react-navigation/native';`,
      `import { createStackNavigator } from '@react-navigation/stack';`,
    ].join('\n');
    const output = run(input);
    expect(output).toContain(`import { NavigationContainer } from "expo-router"`);
    expect(output).toContain(`import { createStackNavigator } from "expo-router/js-stack"`);
    expect(output).toContain(`import React from 'react'`);
    expect(output).not.toContain(`@react-navigation`);
  });
});

describe('merging duplicate imports', () => {
  test('merges duplicate expo-router imports after replacement', () => {
    const input = [
      `import { NavigationContainer } from '@react-navigation/native';`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = run(input);
    expect(output).toBe(`import { NavigationContainer, useNavigation } from "expo-router";`);
  });

  test('merges expo-router imports that come from different original packages', () => {
    const input = [
      `import { NavigationContainer } from '@react-navigation/native';`,
      `import { useRoute } from "expo-router";`,
    ].join('\n');
    const output = run(input);
    expect(output).toBe(`import { NavigationContainer, useRoute } from "expo-router";`);
  });

  test('merges @react-navigation/native with pre-existing expo-router import', () => {
    const input = [
      `import { Link, useRouter } from "expo-router";`,
      `import { NavigationContainer, useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = run(input);
    expect(output).toBe(
      `import { Link, useRouter, NavigationContainer, useNavigation } from "expo-router";`
    );
  });

  test('merges three separate @react-navigation/native imports into one expo-router import', () => {
    const input = [
      `import { NavigationContainer } from '@react-navigation/native';`,
      `import { useNavigation } from '@react-navigation/native';`,
      `import { useRoute } from '@react-navigation/native';`,
    ].join('\n');
    const output = run(input);
    expect(output).toBe(
      `import { NavigationContainer, useNavigation, useRoute } from "expo-router";`
    );
  });

  test('preserves aliased imports when merging', () => {
    const input = [
      `import { useNavigation as useNav } from '@react-navigation/native';`,
      `import { useRoute as useR } from '@react-navigation/native';`,
    ].join('\n');
    const output = run(input);
    expect(output).toBe(`import { useNavigation as useNav, useRoute as useR } from "expo-router";`);
  });

  test('preserves identical aliased imports when merging', () => {
    const input = [
      `import { useNavigation as useNav } from '@react-navigation/native';`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = run(input);
    expect(output).toBe(`import { useNavigation as useNav, useNavigation } from "expo-router";`);
  });

  test('complex real-world scenario with all package types and pre-existing expo-router', () => {
    const input = [
      `import React, { useEffect } from 'react';`,
      `import { View, Text } from 'react-native';`,
      `import { Link } from "expo-router";`,
      `import { NavigationContainer } from '@react-navigation/native';`,
      `import { useNavigation, useRoute } from '@react-navigation/native';`,
      `import { createStackNavigator } from '@react-navigation/stack';`,
      `import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';`,
      `import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';`,
      `import { SafeAreaView } from 'react-native-safe-area-context';`,
    ].join('\n');
    const output = run(input);

    expect(output).toContain(`import React, { useEffect } from 'react'`);
    expect(output).toContain(`import { View, Text } from 'react-native'`);
    expect(output).toContain(`import { SafeAreaView } from 'react-native-safe-area-context'`);

    expect(output).not.toContain(`@react-navigation`);

    expect(output).toContain(`import { createStackNavigator } from "expo-router/js-stack"`);
    expect(output).toContain(`import { createBottomTabNavigator } from "expo-router/js-tabs"`);
    expect(output).toContain(
      `import { createMaterialTopTabNavigator } from "expo-router/js-top-tabs"`
    );

    // Single merged expo-router import, preserving the pre-existing single-quote style
    const expoRouterImports = output.match(/from ['"]expo-router['"]/g);
    expect(expoRouterImports).toHaveLength(1);
    const expoLine = output.split('\n').find((l) => /from ['"]expo-router['"]/.test(l));
    expect(expoLine).toContain('Link');
    expect(expoLine).toContain('NavigationContainer');
    expect(expoLine).toContain('useNavigation');
    expect(expoLine).toContain('useRoute');
  });
});

describe('unsupported import styles', () => {
  test('throws on default import from @react-navigation/native', () => {
    const input = `import Navigation from '@react-navigation/native';`;
    expect(() => run(input)).toThrow(
      'Unsupported import style(s) found:\n' +
        'this/is/test.tsx:1 - default import from "@react-navigation/native" is not supported. ' +
        'Replace with named imports before running this codemod.'
    );
  });

  test('throws on namespace import from @react-navigation/native', () => {
    const input = `import * as Nav from '@react-navigation/native';`;
    expect(() => run(input)).toThrow(
      'Unsupported import style(s) found:\n' +
        'this/is/test.tsx:1 - namespace import (import * as ...) from "@react-navigation/native" is not supported. ' +
        'Replace with named imports before running this codemod.'
    );
  });

  test('throws on default import from @react-navigation/stack', () => {
    const input = `import Stack from '@react-navigation/stack';`;
    expect(() => run(input)).toThrow(
      'Unsupported import style(s) found:\n' +
        'this/is/test.tsx:1 - default import from "@react-navigation/stack" is not supported. ' +
        'Replace with named imports before running this codemod.'
    );
  });

  test('throws on namespace import from @react-navigation/bottom-tabs', () => {
    const input = `import * as Tabs from '@react-navigation/bottom-tabs';`;
    expect(() => run(input)).toThrow(
      'Unsupported import style(s) found:\n' +
        'this/is/test.tsx:1 - namespace import (import * as ...) from "@react-navigation/bottom-tabs" is not supported. ' +
        'Replace with named imports before running this codemod.'
    );
  });

  test('throws on default import from @react-navigation/material-top-tabs', () => {
    const input = `import TopTabs from '@react-navigation/material-top-tabs';`;
    expect(() => run(input)).toThrow(
      'Unsupported import style(s) found:\n' +
        'this/is/test.tsx:1 - default import from "@react-navigation/material-top-tabs" is not supported. ' +
        'Replace with named imports before running this codemod.'
    );
  });

  test('throws when default import is mixed with named imports', () => {
    const input = `import Navigation, { useNavigation } from '@react-navigation/native';`;
    expect(() => run(input)).toThrow(
      'Unsupported import style(s) found:\n' +
        'this/is/test.tsx:1 - default import from "@react-navigation/native" is not supported. ' +
        'Replace with named imports before running this codemod.'
    );
  });

  test('collects all errors when multiple unsupported imports exist', () => {
    const input = [
      `import Navigation from '@react-navigation/native';`,
      `import * as Stack from '@react-navigation/stack';`,
    ].join('\n');
    expect(() => run(input)).toThrow(
      'Unsupported import style(s) found:\n' +
        'this/is/test.tsx:1 - default import from "@react-navigation/native" is not supported. ' +
        'Replace with named imports before running this codemod.\n' +
        'this/is/test.tsx:2 - namespace import (import * as ...) from "@react-navigation/stack" is not supported. ' +
        'Replace with named imports before running this codemod.'
    );
  });

  test('default imports from non-react-navigation packages are left alone', () => {
    const input = [
      `import React from 'react';`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = run(input);
    expect(output).toContain(`import React from 'react'`);
    expect(output).toContain(`from "expo-router"`);
  });
});

describe('type imports', () => {
  test('replaces import type from @react-navigation/native', () => {
    const output = runTS(`import type { ScreenProps } from '@react-navigation/native';`);
    expect(output).toBe(`import type { ScreenProps } from "expo-router";`);
  });

  test('replaces import type from @react-navigation/stack', () => {
    const output = runTS(`import type { StackScreenProps } from '@react-navigation/stack';`);
    expect(output).toBe(`import type { StackScreenProps } from "expo-router/js-stack";`);
  });

  test('replaces import { type ... } from @react-navigation/native', () => {
    const output = runTS(`import { type ScreenProps } from '@react-navigation/native';`);
    expect(output).toBe(`import { type ScreenProps } from "expo-router";`);
  });

  test('replaces import { type ... } from @react-navigation/bottom-tabs', () => {
    const output = runTS(
      `import { type BottomTabScreenProps } from '@react-navigation/bottom-tabs';`
    );
    expect(output).toBe(`import { type BottomTabScreenProps } from "expo-router/js-tabs";`);
  });

  test('handles mixed value and inline type specifiers from react-navigation', () => {
    const output = runTS(
      `import { useNavigation, type NavigationProp } from '@react-navigation/native';`
    );
    expect(output).toBe(`import { useNavigation, type NavigationProp } from "expo-router";`);
  });

  test('handles multiple type specifiers from react-navigation', () => {
    const output = runTS(
      `import type { NavigationProp, RouteProp, ParamListBase } from '@react-navigation/native';`
    );
    expect(output).toBe(
      `import type { NavigationProp, RouteProp, ParamListBase } from "expo-router";`
    );
  });

  test('handles mixed inline type and value specifiers across react-navigation packages', () => {
    const input = [
      `import { useNavigation, type NavigationProp } from '@react-navigation/native';`,
      `import { createStackNavigator, type StackScreenProps } from '@react-navigation/stack';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(
      [
        `import { useNavigation, type NavigationProp } from "expo-router";`,
        `import { createStackNavigator, type StackScreenProps } from "expo-router/js-stack";`,
      ].join('\n')
    );
  });

  test('leaves import type from unrelated packages untouched', () => {
    const input = [
      `import type { FC } from 'react';`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toContain(`import type { FC } from 'react'`);
    expect(output).toContain(`from "expo-router"`);
  });
});

describe('merging type and value imports', () => {
  test('handles import type from expo-router with value import from react-navigation', () => {
    const input = [
      `import type { ScreenProps } from "expo-router";`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    // ScreenProps keeps its type modifier as an inline `type`, useNavigation stays as a value
    expect(output).toBe(`import { type ScreenProps, useNavigation } from "expo-router";`);
  });

  test('handles value import from expo-router with import type from react-navigation', () => {
    const input = [
      `import { useRouter } from "expo-router";`,
      `import type { NavigationProp } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { useRouter, type NavigationProp } from "expo-router";`);
  });

  test('handles import type from react-navigation with value import from react-navigation', () => {
    const input = [
      `import { useNavigation } from '@react-navigation/native';`,
      `import type { NavigationProp } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { useNavigation, type NavigationProp } from "expo-router";`);
  });

  test('handles import type from react-navigation (first) with value import from react-navigation', () => {
    const input = [
      `import type { NavigationProp } from '@react-navigation/native';`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { type NavigationProp, useNavigation } from "expo-router";`);
  });

  test('merges import { type ... } with value import from react-navigation', () => {
    const input = [
      `import { type NavigationProp } from '@react-navigation/native';`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { type NavigationProp, useNavigation } from "expo-router";`);
  });

  test('merges value import with import { type ... } from react-navigation', () => {
    const input = [
      `import { useNavigation } from "expo-router";`,
      `import { type NavigationProp } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { useNavigation, type NavigationProp } from "expo-router";`);
  });

  test('merges import { type ... } from expo-router with value import from react-navigation', () => {
    const input = [
      `import { type Href } from "expo-router";`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { type Href, useNavigation } from "expo-router";`);
  });

  test('merges import type { ... } from expo-router with value import from react-navigation', () => {
    const input = [
      `import type { Href } from "expo-router";`,
      `import { useNavigation } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { type Href, useNavigation } from "expo-router";`);
  });

  test('merges value import from expo-router with import { type ... } from react-navigation', () => {
    const input = [
      `import { useRouter } from "expo-router";`,
      `import { type NavigationProp } from '@react-navigation/native';`,
    ].join('\n');
    const output = runTS(input);
    expect(output).toBe(`import { useRouter, type NavigationProp } from "expo-router";`);
  });
});
