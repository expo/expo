import { clearSharedPayloads } from './Sharing';
import { ResolvedSharePayload, SharePayload } from './Sharing.types';
/**
 * TODO: Docs
 */
export declare function useIncomingShare(): {
    sharedPayloads: SharePayload[];
    resolvedSharedPayloads: ResolvedSharePayload[];
    clearSharedPayloads: typeof clearSharedPayloads;
    isResolving: boolean;
    error: Error | null;
    refreshSharePayloads: () => Promise<void>;
};
//# sourceMappingURL=useIncomingShare.d.ts.map