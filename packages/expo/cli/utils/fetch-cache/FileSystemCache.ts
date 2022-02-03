import cacache from 'cacache';
import { Readable } from 'stream';

function getBodyAndMetaKeys(key: string): [string, string] {
  return [`${key}body`, `${key}meta`];
}

export class FileSystemCache {
  constructor(public options: { ttl?: boolean; cacheDirectory: string }) {}

  async get(key: string) {
    const [, metaKey] = getBodyAndMetaKeys(key);

    const metaInfo = await cacache.get.info(this.options.cacheDirectory, metaKey);

    if (!metaInfo) {
      return undefined;
    }

    const metaBuffer = await cacache.get.byDigest(this.options.cacheDirectory, metaInfo.integrity);
    const metaData = JSON.parse(metaBuffer);
    const { bodyStreamIntegrity, empty, expiration } = metaData;

    delete metaData.bodyStreamIntegrity;
    delete metaData.empty;
    delete metaData.expiration;

    if (expiration && expiration < Date.now()) {
      return undefined;
    }

    const bodyStream = empty
      ? Readable.from(Buffer.alloc(0))
      : cacache.get.stream.byDigest(this.options.cacheDirectory, bodyStreamIntegrity);

    return {
      bodyStream,
      metaData,
    };
  }

  remove(key: string) {
    const [bodyKey, metaKey] = getBodyAndMetaKeys(key);

    return Promise.all([
      cacache.rm.entry(this.options.cacheDirectory, bodyKey),
      cacache.rm.entry(this.options.cacheDirectory, metaKey),
    ]);
  }

  async set(key: string, bodyStream: NodeJS.ReadStream, metaData: any) {
    const [bodyKey, metaKey] = getBodyAndMetaKeys(key);
    const metaCopy = { ...metaData };

    if (typeof this.options.ttl === 'number') {
      metaCopy.expiration = Date.now() + this.options.ttl;
    }

    try {
      metaCopy.bodyStreamIntegrity = await new Promise((fulfill, reject) => {
        bodyStream
          .pipe(cacache.put.stream(this.options.cacheDirectory, bodyKey))
          .on('integrity', i => fulfill(i))
          .on('error', e => {
            reject(e);
          });
      });
    } catch (err: any) {
      if (err.code !== 'ENODATA') {
        throw err;
      }

      metaCopy.empty = true;
    }

    const metaBuffer = Buffer.from(JSON.stringify(metaCopy));
    await cacache.put(this.options.cacheDirectory, metaKey, metaBuffer);
    const cachedData = await this.get(key);

    return cachedData;
  }
}
