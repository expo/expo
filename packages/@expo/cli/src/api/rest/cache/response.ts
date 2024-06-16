import type { CacheObject } from 'cacache';
import { BodyInit, Response, ResponseInit } from 'node-fetch';

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
      headers: res.headers.raw(),
      size: res.size,
      timeout: res.timeout,
      // @ts-ignore
      counter: res[responseInternalSymbol].counter,
    };

    return metaData;
  }
}
