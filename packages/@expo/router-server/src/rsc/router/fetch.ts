import { fetch as upstreamFetch, type FetchRequestInit } from 'expo/fetch';

import { NetworkError } from './errors';

export async function fetch(input: string, init?: FetchRequestInit) {
  try {
    return await upstreamFetch(input, init);
  } catch (error: any) {
    if (error instanceof Error) {
      if (
        error.message.match(
          /(Network request failed|fetch failed): (The network connection was lost|Could not connect to the server)/
        )
      ) {
        throw new NetworkError(error.message, input);
      }
    }
    throw error;
  }
}
