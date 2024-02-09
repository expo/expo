/** These Expo packages may have side-effects and should not be lazily initialized. */
export const lazyImports = new Set(['expo', 'expo-asset', 'expo-task-manager']);
