import type { TurboModule } from "react-native";
import type { ErrorLike } from "./types";
export interface Spec extends TurboModule {
    multiGet: (keys: string[], callback: (error?: ErrorLike[], result?: [string, string][]) => void) => void;
    multiSet: (kvPairs: [string, string][], callback: (error?: ErrorLike[]) => void) => void;
    multiRemove: (keys: readonly string[], callback: (error?: ErrorLike[]) => void) => void;
    multiMerge: (kvPairs: [string, string][], callback: (error?: ErrorLike[]) => void) => void;
    getAllKeys: (callback: (error?: ErrorLike[], result?: [string, string][]) => void) => void;
    clear: (callback: (error?: ErrorLike[]) => void) => void;
}
declare const _default: Spec | null;
export default _default;
//# sourceMappingURL=NativeAsyncStorageModule.d.ts.map