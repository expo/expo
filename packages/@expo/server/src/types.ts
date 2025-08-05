// NOTE(@krystofwoldrich): These types should be moved into the server package
import type { ExpoRoutesManifestV1, RouteInfo } from 'expo-router/build/routes-manifest';

export type RawManifest = ExpoRoutesManifestV1;
export type Manifest = ExpoRoutesManifestV1<RegExp>;
export type Route = RouteInfo<RegExp>;
