export async function downloadAsync(
  url: string,
  _hash: string | null,
  _type: string
): Promise<string> {
  return url;
}

export async function bytes(url: string): Promise<Uint8Array<ArrayBuffer>> {
  throw new Error('Not callable on web');
}
