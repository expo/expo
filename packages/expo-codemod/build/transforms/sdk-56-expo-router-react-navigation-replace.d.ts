/**
 * Codemod: Replace @react-navigation/* imports with expo-router equivalents.
 *
 * Mapping:
 *   @react-navigation/native        → expo-router
 *   @react-navigation/stack         → expo-router/js-stack
 *   @react-navigation/bottom-tabs   → expo-router/js-tabs
 *   @react-navigation/material-top-tabs → expo-router/js-top-tabs
 *
 * After replacement, duplicate `expo-router` imports are merged into one.
 */
import type { Transform } from 'jscodeshift';
declare const transform: Transform;
export default transform;
