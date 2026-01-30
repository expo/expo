import type { SharingOptions, ResolvedSharePayload, SharePayload } from './Sharing.types';
type SharingModule = {
    shareAsync(url: string, options: SharingOptions): Promise<void>;
    getSharedPayloads(): SharePayload[];
    getResolvedSharedPayloadsAsync(): Promise<ResolvedSharePayload[]>;
    clearSharedPayloads(): void;
    isAvailableAsync(): Promise<boolean>;
};
declare const _default: SharingModule;
export default _default;
//# sourceMappingURL=SharingNativeModule.d.ts.map