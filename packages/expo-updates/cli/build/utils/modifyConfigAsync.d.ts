import { ExpoConfig } from 'expo/config';
/** Wraps `[@expo/config] modifyConfigAsync()` and adds additional logging. */
export declare function attemptModification(projectRoot: string, edits: Partial<ExpoConfig>, exactEdits: Partial<ExpoConfig>): Promise<void>;
