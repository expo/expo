// `@expo/metro-runtime` MUST be the first import to ensure Fast Refresh works
// on web.
import '@expo/metro-runtime';

// Hook for the virtual client modules.
// TODO: Remove this in favor of the webpack runtime one.
import 'expo-router/virtual-client-boundaries';
// Add server component support.
import 'expo-router/build/rsc/runtime';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// This file should only import and register the root. No components or exports
// should be added here.
renderRootComponent(App);
