import { fetch as upstreamFetch } from 'expo/fetch';
import { NetworkError } from './errors';

export async function fetch(input: URL | RequestInfo, init?: RequestInit) {
  //   throw new NetworkError('test error', input as string);

  try {
    return await upstreamFetch(input, init);
  } catch (error: any) {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (error instanceof Error) {
      if (
        error.message.match(
          /(Network request failed|fetch failed): (The network connection was lost|Could not connect to the server)/
        )
      ) {
        throw new NetworkError(error.message, url);
      }
    }
    throw error;
  }
}
