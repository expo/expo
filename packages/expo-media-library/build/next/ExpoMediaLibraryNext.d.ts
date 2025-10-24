import { NativeModule } from 'expo-modules-core';
import { Album } from './types/Album';
import { Asset } from './types/Asset';
import { Query } from './types/Query';
declare class ExpoMediaLibraryNextModule extends NativeModule {
    Asset: typeof Asset;
    Album: typeof Album;
    Query: typeof Query;
}
declare const _default: ExpoMediaLibraryNextModule;
export default _default;
//# sourceMappingURL=ExpoMediaLibraryNext.d.ts.map