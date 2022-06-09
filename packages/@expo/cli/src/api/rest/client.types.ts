import { RequestInfo, RequestInit, Response } from 'node-fetch';
import { URLSearchParams } from 'url';

export type ProgressCallback = (props: {
  /** Number ranging from 0 to 1 representing the download percentage. */
  progress: number;
  /** Total size of the download, in bytes. */
  total: number;
  /** Current amount of data downloaded, in bytes. */
  loaded: number;
}) => void;

/**
 * Represents a `fetch`-like function. Used since `typeof fetch` has statics we don't
 * use and aren't interested in hoisting every time we wrap fetch with extra features.
 */
export type FetchLike = (
  url: RequestInfo,
  init?: RequestInit & {
    searchParams?: URLSearchParams;
    /** Progress callback, only implemented when `wrapFetchWithProgress` is used. */
    onProgress?: ProgressCallback;
  }
) => Promise<Response>;
