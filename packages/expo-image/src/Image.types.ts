export enum ImageCacheType {
  UNKNOWN = 0,
  NONE = 1,
  DISK = 2,
  MEMORY = 3,
}

export interface ImageLoadEventData {
  cacheType?: ImageCacheType;
  source: {
    url: string;
    width: number;
    height: number;
    mediaType?: string | null;
  };
}

export interface ImageLoadProgressEventData {
  loaded: number;
  total: number;
}

export interface ImageErrorEventData {
  error: string;
  ios?: {
    code: number;
    domain: string;
    description: string;
    helpAnchor: string | null;
    failureReason: string | null;
    recoverySuggestion: string | null;
  };
}
