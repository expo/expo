import type { NativeModule, PermissionResponse } from 'expo';
import type { NativeAlbumClass } from './NativeAlbumClass.types';
import type { NativeAssetClass } from './NativeAssetClass.types';
import type { NativeQueryClass } from './NativeQueryClass.types';
import type { GranularPermission, MediaTypeFilter, MediaLibraryAssetsChangeEvent } from '../../types';
export declare class NativeMediaLibraryModuleClass extends NativeModule<{
    mediaLibraryDidChange: (event: MediaLibraryAssetsChangeEvent) => void;
}> {
    Asset: typeof NativeAssetClass;
    Album: typeof NativeAlbumClass;
    Query: typeof NativeQueryClass;
    getPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
    requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
    presentPermissionsPicker(mediaTypes?: MediaTypeFilter[]): Promise<void>;
}
//# sourceMappingURL=NativeMediaLibraryModuleClass.types.d.ts.map