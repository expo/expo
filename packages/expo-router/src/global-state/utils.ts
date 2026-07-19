import Constants from 'expo-constants';
import { useColorScheme } from 'react-native';

import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';

export function shouldAppendSitemap() {
  const config = Constants.expoConfig?.extra?.router;
  return config?.sitemap !== false;
}

export function shouldAppendNotFound() {
  const config = Constants.expoConfig?.extra?.router;
  return config?.notFound !== false;
}

export function shouldReactToColorSchemeChanges() {
  const config = Constants.expoConfig?.extra?.router;
  return config?.adaptiveColors !== false;
}

// TODO(@ubax): Replace this with a custom theme provider, once we can pass ColorValue objects through the React Navigation theme.
// https://linear.app/expo/issue/ENG-19168/replace-global-usecolorschme-with-a-custom-theme-provider-once-we-can
export const useColorSchemeChangesIfNeeded = shouldReactToColorSchemeChanges()
  ? useColorScheme
  : function () {};

export function getRootStackRouteNames() {
  const routes = [INTERNAL_SLOT_NAME];
  if (shouldAppendNotFound()) {
    routes.push(NOT_FOUND_ROUTE_NAME);
  }
  if (shouldAppendSitemap()) {
    routes.push(SITEMAP_ROUTE_NAME);
  }
  return routes;
}
