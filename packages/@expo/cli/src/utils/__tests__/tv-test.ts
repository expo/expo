import { needsReactNativeDependencyChangedForTV } from '../tv';

describe('tv-test', () => {
  test('needsReactNativeDependencyChangedForTV', () => {
    // If no react-native dependency, we are ok with phone or TV (template will add the right one)
    const depsWithoutRN = {};
    expect(needsReactNativeDependencyChangedForTV(depsWithoutRN, { isTV: false })).toBe(false);
    expect(needsReactNativeDependencyChangedForTV(depsWithoutRN, { isTV: true })).toBe(false);
    // If core react-native dependency and isTV is true, return true
    const depsWithRNCore = { 'react-native': '0.72' };
    expect(needsReactNativeDependencyChangedForTV(depsWithRNCore, { isTV: false })).toBe(false);
    expect(needsReactNativeDependencyChangedForTV(depsWithRNCore, { isTV: true })).toBe(true);
    // If TV react-native dependency, we are ok with phone or TV
    const depsWithRNTV = { 'react-native': 'npm:react-native-tvos@0.72' };
    expect(needsReactNativeDependencyChangedForTV(depsWithRNTV, { isTV: false })).toBe(false);
    expect(needsReactNativeDependencyChangedForTV(depsWithRNTV, { isTV: true })).toBe(false);
  });
});
