import { defaultShouldIncludeDependency } from '../utils';

describe(defaultShouldIncludeDependency, () => {
  it.each([
    ['@babel/core', false],
    ['@babel/plugin-transform-commonjs', false],
    ['@eslint/plugin-core', false],
    ['eslint', false],
    ['eslint-config-expo', false],
    ['@typescript-eslint/test', false],
    ['@types/node', false],
    ['@expo/env', false],
    ['react-native', false],
    ['expo', true],
    ['expo-audio', true],
    ['react-native-third-party', true],
  ])('%s returns %b', (name, expected) => {
    expect(defaultShouldIncludeDependency(name)).toBe(expected);
  });
});
