export enum BackgroundFetchResult {
  NoData = 1,
  NewData = 2,
  Failed = 3,
}

export enum BackgroundFetchStatus {
  Denied = 1,
  Restricted = 2,
  Available = 3,
}

export interface BackgroundFetchOptions {
  minimumInterval?: number;
  stopOnTerminate?: boolean;
  startOnBoot?: boolean;
}
