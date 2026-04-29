/* eslint-disable import/order, import/first */
import * as Index from '../';

const SHADOWED_FROM_NATIVE_VALUE = [
  'useNavigation',
  'useFocusEffect',
  'useIsFocused',
  'useNavigationContainerRef',
  // This should not be used anywhere
  'PrivateValueStore',
] as const;
const SHADOWED_FROM_NATIVE = new Set<string>(SHADOWED_FROM_NATIVE_VALUE);

const RENAMED_FROM_ELEMENTS_VALUE = {
  Label: 'RNLabel',
  Badge: 'RNBadge',
} as const;
type RenamedFromElements = keyof typeof RENAMED_FROM_ELEMENTS_VALUE;

describe('react-navigation/index re-exports', () => {
  it.each([
    { name: 'core', code: require('../core') },
    { name: 'native', code: require('../native') },
    { name: 'routers', code: require('../routers') },
  ] as const)(
    're-exports every value from ./$name (except intentionally shadowed)',
    async ({ code }) => {
      const expected = Object.keys(code).filter((key) => !SHADOWED_FROM_NATIVE.has(key));
      const missing = expected.filter((key) => !(key in Index));
      expect(missing).toEqual([]);
    }
  );

  it('re-exports every value from ./elements (except intentionally renamed)', () => {
    const code = require('../elements');
    const expected = Object.keys(code).filter(
      (key) =>
        !SHADOWED_FROM_NATIVE.has(key) && !RENAMED_FROM_ELEMENTS_VALUE[key as RenamedFromElements]
    );
    const missing = expected.filter((key) => !(key in Index));
    expect(missing).toEqual([]);
    Object.values(RENAMED_FROM_ELEMENTS_VALUE).forEach((newName) => {
      expect(Object.keys(code).includes(newName));
    });
  });
});

/**
 * The tests below ensure that we export all types from subpackages
 */

import type * as NativeType from '../native';
import type * as CoreType from '../core';
import type * as ElementsType from '../elements';
import type * as RoutersType from '../routers';
import type * as IndexType from '../index';

type Excluded = (typeof SHADOWED_FROM_NATIVE_VALUE)[number];

type MissingFromIndexNative = Exclude<keyof typeof NativeType, keyof typeof IndexType | Excluded>;
type MissingFromIndexCore = Exclude<keyof typeof CoreType, keyof typeof IndexType | Excluded>;
type MissingFromIndexElements = Exclude<
  keyof typeof ElementsType,
  keyof typeof IndexType | Excluded | RenamedFromElements
>;
type MissingFromIndexRouters = Exclude<keyof typeof RoutersType, keyof typeof IndexType | Excluded>;

type AssertNever<T extends never> = T;

// If there is type error here it means we are not exporting everything we should
export type _NoMissingNativeExports = AssertNever<MissingFromIndexNative>;
export type _NoMissingCoreExports = AssertNever<MissingFromIndexCore>;
export type _NoMissingElementsExports = AssertNever<MissingFromIndexElements>;
export type _NoMissingRoutersExports = AssertNever<MissingFromIndexRouters>;

/**
 * The tests below ensure that our exports are compatible with react-navigation exports
 */
// In order to run these tests you need to add `@react-navigation/*` packages as devDependencies of expo-router
// import type * as RNNativeType from '@react-navigation/native';
// import type * as RNCoreType from '@react-navigation/core';
// import type * as RNElementsType from '@react-navigation/elements';

// import * as RouterExports from '../../';

// const EXCLUDED_FROM_REACT_NAVIGATION_VALUES = [
//   // Expo router covers this inside ExpoRoot.
//   // The only use-case external user may have is for testing
//   // custom navigators. If we get a report, we can always export our
//   // implementation of this hook
//   'NavigationContainer',
//   // People should use `Link` component.
//   'useLinkTo',
//   'useLinkProps',
//   // Similar to NavigationContainer
//   'createStaticNavigation',
//   // It is not listed in docs, so we assume it is not used
//   // We can always reexport it if needed
//   'Lazy',
//   // This component works similar to `<Link asChild>`
//   // People should use link instead
//   'Button',
// ] as const;
// const EXCLUDED_FROM_REACT_NAVIGATION = new Set<string>(EXCLUDED_FROM_REACT_NAVIGATION_VALUES);

// type RNExcludedTypes = (typeof EXCLUDED_FROM_REACT_NAVIGATION_VALUES)[number];

// type MissingFromRNNative = Exclude<
//   keyof typeof RNNativeType,
//   keyof typeof RouterExports | RNExcludedTypes
// >;
// type MissingFromRNCore = Exclude<
//   keyof typeof RNCoreType,
//   keyof typeof RouterExports | RNExcludedTypes
// >;
// type MissingFromRNElements = Exclude<
//   keyof typeof RNElementsType,
//   keyof typeof RouterExports | RNExcludedTypes
// >;

// // If there is type error here it means we are not exporting everything we should
// export type _NoMissingRNNativeExports = AssertNever<MissingFromRNNative>;
// export type _NoMissingRNCoreExports = AssertNever<MissingFromRNCore>;
// export type _NoMissingRNElementsExports = AssertNever<MissingFromRNElements>;

// describe('compatibility check with react-navigation dependencies', () => {
//   it.each([
//     { name: 'core', code: require('@react-navigation/core') },
//     { name: 'native', code: require('@react-navigation/native') },
//     { name: 'routers', code: require('@react-navigation/routers') },
//     { name: 'elements', code: require('@react-navigation/elements') },
//   ] as const)(
//     're-exports every value from ./$name (except intentionally shadowed)',
//     async ({ code }) => {
//       const expected = Object.keys(code).filter((key) => !EXCLUDED_FROM_REACT_NAVIGATION.has(key));
//       const missing = expected.filter((key) => !(key in RouterExports));
//       expect(missing).toEqual([]);
//     }
//   );
// });
