type PlatformMethod = (...args: any[]) => Promise<any>;

export interface ExponentFileSystemModule {
  readonly documentDirectory: string | null;
  readonly cacheDirectory: string | null;
  readonly bundleDirectory: string | null;
  readonly getInfoAsync?: PlatformMethod;
  readonly readAsStringAsync?: PlatformMethod;
  readonly writeAsStringAsync?: PlatformMethod;
  readonly deleteAsync?: PlatformMethod;
  readonly moveAsync?: PlatformMethod;
  readonly copyAsync?: PlatformMethod;
  readonly makeDirectoryAsync?: PlatformMethod;
  readonly readDirectoryAsync?: PlatformMethod;
  readonly downloadAsync?: PlatformMethod;
  readonly uploadAsync?: PlatformMethod;
  readonly downloadResumableStartAsync?: PlatformMethod;
  readonly downloadResumablePauseAsync?: PlatformMethod;
  readonly getContentUriAsync?: PlatformMethod;
  readonly getFreeDiskStorageAsync?: PlatformMethod;
  readonly getTotalDiskCapacityAsync?: PlatformMethod;
  readonly requestDirectoryPermissionsAsync?: PlatformMethod;
  readonly readSAFDirectoryAsync?: PlatformMethod;
  readonly makeSAFDirectoryAsync?: PlatformMethod;
  readonly createSAFFileAsync?: PlatformMethod;
  readonly networkTaskCancelAsync?: PlatformMethod;
  readonly uploadTaskStartAsync?: PlatformMethod;
  startObserving?: () => void;
  stopObserving?: () => void;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}
