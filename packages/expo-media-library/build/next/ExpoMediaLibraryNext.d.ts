import type { PermissionResponse } from 'expo';
import { NativeModule } from 'expo-modules-core';
import type { GranularPermission, MediaLibraryAssetsChangeEvent } from './MediaLibraryNext.types';
import { Album } from './types/Album';
import { Asset } from './types/Asset';
import type { MediaTypeFilter } from './types/MediaTypeFilter';
import { Query } from './types/Query';
declare class ExpoMediaLibraryNextModule extends NativeModule<{
    mediaLibraryDidChange: (event: MediaLibraryAssetsChangeEvent) => void;
}> {
    Asset: typeof Asset;
    Album: typeof Album;
    Query: typeof Query;
    getPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
    requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
    presentPermissionsPicker(mediaTypes?: MediaTypeFilter[]): Promise<void>;
}
declare const _default: ExpoMediaLibraryNextModule;
export default _default;
//# sourceMappingURL=ExpoMediaLibraryNext.d.ts.map