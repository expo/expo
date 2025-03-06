import { blobToArrayBufferAsync } from '../../utils/blobUtils';

/**
 * Convert FormData to Uint8Array with a boundary
 *
 * `uri` is not supported for React Native's FormData.
 * `blob` is not supported for standard FormData.
 */
export async function convertFormDataAsync(
  formData: FormData,
  boundary: string = createBoundary()
): Promise<{ body: Uint8Array; boundary: string }> {
  // @ts-expect-error: React Native's FormData is not compatible with the web's FormData
  if (typeof formData.getParts !== 'function') {
    throw new Error('Unsupported FormData implementation');
  }
  // @ts-expect-error: React Native's FormData is not 100% compatible with ours
  const parts: ExpoFormDataPart[] = formData.getParts();

  const results: (Uint8Array | string)[] = [];
  for (const entry of parts) {
    results.push(`--${boundary}\r\n`);
    for (const [headerKey, headerValue] of Object.entries(entry.headers)) {
      results.push(`${headerKey}: ${headerValue}\r\n`);
    }
    results.push(`\r\n`);
    if ('string' in entry) {
      results.push(entry.string);
    } else if ('file' in entry) {
      results.push(entry.file.bytes());
    } else if ('blob' in entry) {
      results.push(new Uint8Array(await blobToArrayBufferAsync(entry.blob)));
    } else if (entry._data?.blobId != null) {
      // When `FormData.getParts()` is called, React Native will use the spread syntax to copy the object and lose the Blob type info.
      // We should find the original Blob instance from the `FormData._parts` internal properties.
      // @ts-expect-error: react-native's proprietary Blob type
      const formDatum = formData._parts?.find(
        ([name, value]) => value.data?.blobId === entry._data.blobId
      );
      if (formDatum == null) {
        throw new Error('Cannot find the original Blob instance from FormData');
      }
      if (!(formDatum[1] instanceof Blob)) {
        throw new Error('Unexpected value type for Blob entry in FormData');
      }
      results.push(new Uint8Array(await blobToArrayBufferAsync(formDatum[1])));
    } else {
      throw new Error('Unsupported FormDataPart implementation');
    }
    results.push(`\r\n`);
  }

  results.push(`--${boundary}--\r\n`);
  const arrays = results.map((result) => {
    if (typeof result === 'string') {
      // @ts-ignore: TextEncoder is not available in all environments
      return new TextEncoder().encode(result);
    } else {
      return result;
    }
  }) as Uint8Array[];

  return { body: joinUint8Arrays(arrays), boundary };
}

/**
 * Create mutipart boundary
 */
export function createBoundary(): string {
  const boundaryChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let boundary = '----ExpoFetchFormBoundary';
  for (let i = 0; i < 16; i++) {
    boundary += boundaryChars.charAt(Math.floor(Math.random() * boundaryChars.length));
  }
  return boundary;
}

/**
 * Merge Uint8Arrays into a single Uint8Array
 */
export function joinUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength: number = arrays.reduce((acc: number, arr: Uint8Array) => acc + arr.length, 0);
  const result: Uint8Array = new Uint8Array(totalLength);

  let offset: number = 0;
  arrays.forEach((array: Uint8Array) => {
    result.set(array, offset);
    offset += array.length;
  });

  return result;
}
