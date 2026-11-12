export type Heading = {
  trueHeading: number | null;
  magneticHeading: number;
  accuracy: number | null;
  timestamp: number;
};

export type HeadingWatchError = {
  code: string;
  message: string;
};

export type HeadingUpdate =
  | { data: Heading; error: null }
  | { data: null; error: HeadingWatchError };

export type HeadingWatchStatus = {
  isSubscribed: boolean;
  isHandleAlive: boolean;
  isStarted: boolean;
  isPaused: boolean;
};

export type WatchHeadingParams = {
  filter?: number;
  onHeading: (heading: Heading) => void;
  onError?: (error: HeadingWatchError) => void;
};
