/* eslint-disable import/order, import/first */
import * as Index from '../';

describe('react-navigation/index re-exports', () => {
  it.each([
    { name: 'core', code: require('../core') },
    { name: 'native', code: require('../native') },
    { name: 'routers', code: require('../routers') },
    { name: 'elements', code: require('../elements') },
  ] as const)('re-exports every value from ./$name ', async ({ code }) => {
    const expected = Object.keys(code);
    const missing = expected.filter((key) => !(key in Index));
    expect(missing).toEqual([]);
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

type MissingFromIndexNative = Exclude<keyof typeof NativeType, keyof typeof IndexType>;
type MissingFromIndexCore = Exclude<keyof typeof CoreType, keyof typeof IndexType>;
type MissingFromIndexElements = Exclude<keyof typeof ElementsType, keyof typeof IndexType>;
type MissingFromIndexRouters = Exclude<keyof typeof RoutersType, keyof typeof IndexType>;

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
// pnpm i -D @react-navigation/native @react-navigation/core @react-navigation/elements
// import type * as RNNativeType from '@react-navigation/native';
// import type * as RNCoreType from '@react-navigation/core';
// import type * as RNElementsType from '@react-navigation/elements';

// type MissingFromRNNative = Exclude<keyof typeof RNNativeType, keyof typeof Index>;
// type MissingFromRNCore = Exclude<keyof typeof RNCoreType, keyof typeof Index>;
// type MissingFromRNElements = Exclude<keyof typeof RNElementsType, keyof typeof Index>;

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
//   ] as const)('re-exports every value from ./$name', async ({ code }) => {
//     const expected = Object.keys(code);
//     const missing = expected.filter((key) => !(key in Index));
//     expect(missing).toEqual([]);
//   });
// });
