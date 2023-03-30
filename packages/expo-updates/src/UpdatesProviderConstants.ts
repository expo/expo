import * as Updates from './Updates';
import type { CurrentlyRunningInfo } from './UpdatesProvider.types';
/////// Constants and enums  ////////

// The currently running info, constructed from Updates constants
export const currentlyRunning: CurrentlyRunningInfo = {
  updateId: Updates.updateId,
  channel: Updates.channel,
  createdAt: Updates.createdAt,
  isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  isEmergencyLaunch: Updates.isEmergencyLaunch,
  manifest: Updates.manifest,
  runtimeVersion: Updates.runtimeVersion,
};
