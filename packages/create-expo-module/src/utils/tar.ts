import { Readable, Stream } from 'node:stream';
import { promisify } from 'node:util';
import { extract as tarExtract } from 'tar';

import { fetch } from './fetch';

const debug = require('debug')('create-expo-module:tar') as typeof console.log;
const pipeline = promisify(Stream.pipeline);

type DownloadAndExtractTarballOptions = {
  /** The publicly accessible URL to download the tarball from */
  url: string;
  /** The local folder to extract to */
  dir: string;
};

/** Download and extract tarballs directly from a publicly accessible URL */
export async function downloadAndExtractTarball({ url, dir }: DownloadAndExtractTarballOptions) {
  const response = await fetch(url);

  if (!response.ok) {
    debug(`Failed to fetch "%s", received response: %O`, url, response);
    throw new Error(`Failed to download "${url}", received response status ${response.status}.`);
  }

  if (!response.body) {
    debug(`Failed to fetch "%s", received no response body: %O`, url, response);
    throw new Error(`Failed to download "${url}", received no response body.`);
  }

  await pipeline(
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>),
    tarExtract({ cwd: dir })
  );
}
