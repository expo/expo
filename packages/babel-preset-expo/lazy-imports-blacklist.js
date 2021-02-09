/**
 * These Expo packages may have side-effects and should not be lazily initialized.
 */
'use strict';

module.exports = new Set(['expo', 'expo-asset', 'expo-task-manager']);
