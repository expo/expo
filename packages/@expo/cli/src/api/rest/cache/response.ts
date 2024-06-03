import type { CacheObject } from 'cacache';

const responseInternalSymbol = Object.getOwnPropertySymbols(new Response())[1];

export class NFCResponse extends Response {
  constructor(
    bodyStream?: BodyInit,
    metaData?: ResponseInit,
    public ejectFromCache: () => Promise<[CacheObject, CacheObject]> = function ejectFromCache(
      this: any
    ) {
      return this.ejectSelfFromCache();
    },
    public fromCache: boolean = false
  ) {
    super(bodyStream, metaData);
  }

  static serializeMetaFromNodeFetchResponse(res: Response) {
    const metaData = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      size: res.headers.get('content-length'),
      // timeout: res.timeout, // Non-standard node-fetch property
      // @ts-expect-error
      counter: res[responseInternalSymbol].counter,
    };

    return metaData;
  }
}
