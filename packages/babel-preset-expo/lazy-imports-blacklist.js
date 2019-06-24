/**
 * These expo packages may have side-effects and should not be lazy-initialized.
 */
'use strict';

module.exports = new Set([
  'expo',
  'expo-asset',
  'expo-av',
  'expo-background-fetch',
  'expo-constants',
  'expo-file-system',
  'expo-font',
  'expo-location',
  'expo-sqlite',
  'expo-task-manager',
  'jest-expo',
]);
