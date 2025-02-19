import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import stream, { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import type { ResponseCache, ResponseCacheEntry } from './ResponseCache';
import { fileExistsAsync } from '../../../utils/dir';

type FileSystemResponseCacheInfo = ResponseCacheEntry['info'] & {
  /** The path to the cached body file */
  bodyPath?: string;
  /** If there is no response body */
  empty?: boolean;
  /** The expiration time, in milliseconds, when the response should be invalidated */
  expiration?: number;
};

export class FileSystemResponseCache implements ResponseCache {
  /** The absolute path to the directory used to store responses */
  private cacheDirectory: string;
  /** Optional auto-expiration for all stored responses */
  private timeToLive?: number;

  constructor(options: { cacheDirectory: string; ttl?: number }) {
    this.cacheDirectory = options.cacheDirectory;
    this.timeToLive = options.ttl;
  }

  private getFilePaths(cacheKey: string) {
    // Create a hash of the cache key to use as filename
    const hash = crypto.createHash('sha256').update(cacheKey).digest('hex');
    return {
      info: path.join(this.cacheDirectory, `${hash}-info.json`),
      body: path.join(this.cacheDirectory, `${hash}-body.bin`),
    };
  }

  /** Retrieve the cache response, if any */
  async get(cacheKey: string): Promise<ResponseCacheEntry | undefined> {
    const paths = this.getFilePaths(cacheKey);

    if (!(await fileExistsAsync(paths.info))) {
      return undefined;
    }

    // Read and parse the info file
    const infoBuffer = await fs.promises.readFile(paths.info);

    try {
      const responseInfo: FileSystemResponseCacheInfo = JSON.parse(infoBuffer.toString());

      // Check if the response has expired
      if (responseInfo.expiration && responseInfo.expiration < Date.now()) {
        await this.remove(cacheKey);
        return undefined;
      }

      // Remove cache-specific data from the response info
      const { empty, expiration, bodyPath, ...cleanInfo } = responseInfo;

      // Create response body stream
      let responseBody: ReadableStream;
      if (empty) {
        responseBody = Readable.toWeb(Readable.from(Buffer.alloc(0)));
      } else {
        const bodyBuffer = await fs.promises.readFile(paths.body);
        responseBody = Readable.toWeb(Readable.from(bodyBuffer));
      }

      return {
        body: responseBody,
        info: cleanInfo,
      };
    } catch {
      // If file doesn't exist or other errors, return undefined
      return undefined;
    }
  }

  /** Store the response for caching */
  async set(
    cacheKey: string,
    response: ResponseCacheEntry
  ): Promise<ResponseCacheEntry | undefined> {
    await fs.promises.mkdir(this.cacheDirectory, { recursive: true });
    const paths = this.getFilePaths(cacheKey);

    // Create a copy of the response info, to add cache-specific data
    const responseInfo: FileSystemResponseCacheInfo = { ...response.info };

    // Add expiration time if the "time to live" is set
    if (typeof this.timeToLive === 'number') {
      responseInfo.expiration = Date.now() + this.timeToLive;
    }

    try {
      // Clone the response body stream since we need to read it twice
      const [forSize, forWrite] = response.body.tee();

      // Check if the body is empty by reading the first stream
      const reader = forSize.getReader();
      const { value } = await reader.read();
      reader.releaseLock();

      if (!value || value.length === 0) {
        responseInfo.empty = true;
      } else {
        // Create write stream and pipe response body to file
        const writeStream = fs.createWriteStream(paths.body);
        const nodeStream = Readable.fromWeb(forWrite);
        nodeStream.pipe(writeStream);

        // Wait for the stream to finish
        await stream.promises.finished(writeStream);

        responseInfo.bodyPath = paths.body;
      }

      // Write info to file
      await fs.promises.writeFile(paths.info, JSON.stringify(responseInfo));

      return await this.get(cacheKey);
    } catch (error) {
      // Clean up any partially written files
      await this.remove(cacheKey);
      throw error;
    }
  }

  /** Remove the response from caching */
  async remove(cacheKey: string): Promise<void> {
    const paths = this.getFilePaths(cacheKey);
    await removeAllAsync(paths.info, paths.body);
  }
}

function removeAllAsync(...paths: string[]) {
  return Promise.all(
    paths.map((path) => fs.promises.rm(path, { recursive: true, force: true }).catch(() => {}))
  );
}
