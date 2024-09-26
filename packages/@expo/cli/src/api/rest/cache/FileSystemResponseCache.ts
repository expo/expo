import cacache from 'cacache';
import { Readable } from 'stream';

import type { ResponseCache, ResponseCacheEntry } from './ResponseCache';

type FileSystemResponseCacheInfo = ResponseCacheEntry['info'] & {
  /** Stream integrity used to validate the local body response */
  bodyIntegrity?: string;
  /** If there is no response body */
  empty?: boolean;
  /** The expiration time, in seconds, when the response should be invalidated */
  expiration?: number;
};

export class FileSystemResponseCache implements ResponseCache {
  /** The absolute path to the directory used to store responses */
  private cacheDirectory: string;
  /** Optional auto-expiration for all stored response */
  private timeToLive?: number;

  constructor(options: { cacheDirectory: string; ttl?: number }) {
    this.cacheDirectory = options.cacheDirectory;
    this.timeToLive = options.ttl;
  }

  /** Retrieve the cache response, if any */
  async get(cacheKey: string): Promise<ResponseCacheEntry | undefined> {
    const responseInfoKey = getResponseInfoKey(cacheKey);
    const responseInfoMeta = await cacache.get.info(this.cacheDirectory, responseInfoKey);

    // Abort if the response info is not found
    if (!responseInfoMeta) {
      return undefined;
    }

    const responseInfoBuffer = await cacache.get.byDigest(
      this.cacheDirectory,
      responseInfoMeta.integrity
    );
    const responseInfo: FileSystemResponseCacheInfo = JSON.parse(responseInfoBuffer.toString());

    // Remove cache-specific data from the response info
    const { empty, expiration, bodyIntegrity } = responseInfo;
    delete responseInfo.empty;
    delete responseInfo.expiration;
    delete responseInfo.bodyIntegrity;

    // Invalidate the response if it has expired, or there is no known body integrity
    if (!bodyIntegrity || (expiration && expiration < Date.now())) {
      return undefined;
    }

    // Create a read-stream for the response body
    const responseBody = empty
      ? Readable.from(Buffer.alloc(0))
      : Readable.from(cacache.get.stream.byDigest(this.cacheDirectory, bodyIntegrity));

    return {
      body: Readable.toWeb(responseBody),
      info: responseInfo,
    };
  }

  /** Store the response for caching */
  async set(
    cacheKey: string,
    response: ResponseCacheEntry
  ): Promise<ResponseCacheEntry | undefined> {
    const responseBodyKey = getResponseBodyKey(cacheKey);
    const responseInfoKey = getResponseInfoKey(cacheKey);

    // Create a copy of the response info, to add cache-specific data
    const responseInfo: FileSystemResponseCacheInfo = { ...response.info };

    // Add expiration time if the "time to live" is set
    if (typeof this.timeToLive === 'number') {
      responseInfo.expiration = Date.now() + this.timeToLive;
    }

    try {
      // Store the response body as stream, and calculate the stream integrity
      responseInfo.bodyIntegrity = await new Promise((fulfill, reject) => {
        Readable.fromWeb(response.body)
          .pipe(cacache.put.stream(this.cacheDirectory, responseBodyKey))
          .on('integrity', (integrity) => fulfill(integrity))
          .once('error', reject);
      });
    } catch (error: any) {
      if (error.code !== 'ENODATA') {
        throw error;
      }

      // Mark the response as empty
      responseInfo.empty = true;
      responseInfo.bodyIntegrity = undefined;
    }

    // Store the response info
    const responseInfoBuffer = Buffer.from(JSON.stringify(responseInfo));
    await cacache.put(this.cacheDirectory, responseInfoKey, responseInfoBuffer);

    return await this.get(cacheKey);
  }

  /** Remove the response from caching */
  async remove(cacheKey: string): Promise<void> {
    await Promise.all([
      cacache.rm.entry(this.cacheDirectory, getResponseBodyKey(cacheKey)),
      cacache.rm.entry(this.cacheDirectory, getResponseBodyKey(cacheKey)),
    ]);
  }
}

function getResponseBodyKey(cacheKey: string) {
  return `${cacheKey}UndiciBody`;
}

function getResponseInfoKey(cacheKey: string) {
  return `${cacheKey}UndiciInfo`;
}
