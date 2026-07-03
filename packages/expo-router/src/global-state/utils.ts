import Constants from 'expo-constants';
import { useColorScheme } from 'react-native';

import { INTERNAL_SLOT_NAME } from '../constants';
import { store } from './store';

export function shouldReactToColorSchemeChanges() {
  const config = Constants.expoConfig?.extra?.router;
  return config?.adaptiveColors !== false;
}

// TODO(@ubax): Replace this with a custom theme provider, once we can pass ColorValue objects through the React Navigation theme.
// https://linear.app/expo/issue/ENG-19168/replace-global-usecolorschme-with-a-custom-theme-provider-once-we-can
export const useColorSchemeChangesIfNeeded = shouldReactToColorSchemeChanges()
  ? useColorScheme
  : function () {};

// The root stack's route names come from the compiled linking config's top-level screen keys — the
// single source of truth for the internal-slot level. `getLinkingConfig` produces exactly
// `[__root, +not-found?, _sitemap?]` (omitting `+not-found` when the app declares its own root-level
// catch-all, and each generated screen when disabled), so this always matches the rendered
// `<Screen>` order in ExpoRoot's `Content`. Falls back to just the slot before linking is available.
export function getRootStackRouteNames(): string[] {
  const screens = store.linking?.config?.screens;
  return screens ? Object.keys(screens) : [INTERNAL_SLOT_NAME];
}
