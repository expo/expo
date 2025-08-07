import Constants from 'expo-constants';

import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';

export function shouldAppendSitemap() {
  const config = Constants.expoConfig?.extra?.router;
  return config?.sitemap !== false;
}

export function shouldAppendNotFound() {
  const config = Constants.expoConfig?.extra?.router;
  return config?.notFound !== false;
}

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
