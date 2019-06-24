/**
 * These expo packages may have side-effects and should not be lazy-initialized.
 */
'use strict';

module.exports = new Set([
  'expo',
  'expo-asset',
  'expo-av',
  'expo-background-fetch',
  'expo-brightness',
  'expo-camera',
  'expo-constants',
  'expo-crypto',
  'expo-file-system',
  'expo-font',
  'expo-haptics',
  'expo-image-manipulator',
  'expo-image-picker',
  'expo-intent-launcher',
  'expo-local-authentication',
  'expo-location',
  'expo-permissions',
  'expo-speech',
  'expo-sqlite',
  'expo-task-manager',
  'jest-expo',
]);
