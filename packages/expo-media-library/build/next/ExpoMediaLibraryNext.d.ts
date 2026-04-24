import type { PermissionResponse } from 'expo-modules-core';
import { NativeModule } from 'expo-modules-core';
import type { GranularPermission } from './MediaLibraryNext.types';
import type { Album } from './types/Album';
import type { Asset } from './types/Asset';
import type { Query } from './types/Query';
declare class ExpoMediaLibraryNextModule extends NativeModule {
    Asset: typeof Asset;
    Album: typeof Album;
    Query: typeof Query;
    getPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
    requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
}
declare const _default: ExpoMediaLibraryNextModule;
export default _default;
//# sourceMappingURL=ExpoMediaLibraryNext.d.ts.map