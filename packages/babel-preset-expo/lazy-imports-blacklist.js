/**
 * These expo packages may have side-effects and should not be lazy-initialized.
 */
'use strict';

module.exports = new Set(['expo', 'expo-asset', 'expo-task-manager']);
