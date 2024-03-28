/**
 * @license React
 * react-refresh-runtime.production.min.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

{
  throw new Error('React Refresh runtime should not be included in the production bundle.');
} // In old environments, we'll leak previous types after every edit.

function performReactRefresh() {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function register(type, id) {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function setSignature(type, key) {

  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
} // This is lazily called during first render for a type.
// It captures Hook list at that time so inline requires don't break comparisons.

function collectCustomHooksForSignature(type) {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function getFamilyByID(id) {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function getFamilyByType(type) {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function findAffectedHostInstances(families) {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function injectIntoGlobalHook(globalObject) {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function hasUnrecoverableErrors() {
  // TODO: delete this after removing dependency in RN.
  return false;
} // Exposed for testing.

function _getMountedRootCount() {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
} // This is a wrapper over more primitive functions for setting signature.
// Signatures let us decide whether the Hook order has changed on refresh.
//
// This function is intended to be used as a transform target, e.g.:
// var _s = createSignatureFunctionForTransform()
//
// function Hello() {
//   const [foo, setFoo] = useState(0);
//   const value = useCustomHook();
//   _s(); /* Call without arguments triggers collecting the custom Hook list.
//          * This doesn't happen during the module evaluation because we
//          * don't want to change the module order with inline requires.
//          * Next calls are noops. */
//   return <h1>Hi</h1>;
// }
//
// /* Call with arguments attaches the signature to the type: */
// _s(
//   Hello,
//   'useState{[foo, setFoo]}(0)',
//   () => [useCustomHook], /* Lazy to avoid triggering inline requires */
// );

function createSignatureFunctionForTransform() {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}
function isLikelyComponentType(type) {
  {
    throw new Error('Unexpected call to React Refresh in a production environment.');
  }
}

exports._getMountedRootCount = _getMountedRootCount;
exports.collectCustomHooksForSignature = collectCustomHooksForSignature;
exports.createSignatureFunctionForTransform = createSignatureFunctionForTransform;
exports.findAffectedHostInstances = findAffectedHostInstances;
exports.getFamilyByID = getFamilyByID;
exports.getFamilyByType = getFamilyByType;
exports.hasUnrecoverableErrors = hasUnrecoverableErrors;
exports.injectIntoGlobalHook = injectIntoGlobalHook;
exports.isLikelyComponentType = isLikelyComponentType;
exports.performReactRefresh = performReactRefresh;
exports.register = register;
exports.setSignature = setSignature;