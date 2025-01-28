import type { Manifest, UpdatesNativeStateMachineContext, UpdatesNativeStateRollback } from './Updates.types';
import { type CurrentlyRunningInfo, type UpdateInfo, type UseUpdatesReturnType } from './UseUpdates.types';
export declare const currentlyRunning: CurrentlyRunningInfo;
export declare const updateFromManifest: (manifest: NonNullable<Manifest>) => UpdateInfo;
export declare const updateFromRollback: (rollback: UpdatesNativeStateRollback) => UpdateInfo;
export declare const updatesStateFromContext: (context: UpdatesNativeStateMachineContext) => Omit<UseUpdatesReturnType, 'currentlyRunning'>;
//# sourceMappingURL=UseUpdatesUtils.d.ts.map