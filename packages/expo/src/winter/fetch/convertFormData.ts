import { blobToArrayBufferAsync } from '../../utils/blobUtils';
import { type ExpoFormDataValue } from '../FormData';

function encodeFilename(filename: string): string {
  return encodeURIComponent(filename.replace(/\//g, '_'));
}

type ExpoFormHeaders = {
  'content-disposition': string | undefined;
  'content-type': string | undefined;
};

function getFormDataPartHeaders(part: ExpoFormDataValue, name: string) {
  const contentDisposition = 'form-data; name="' + name + '"';

  const headers: ExpoFormHeaders = {
    'content-disposition': contentDisposition,
    'content-type': undefined,
  };

  if (typeof part === 'object') {
    if ('name' in part && typeof part.name === 'string') {
      headers['content-disposition'] += `; filename="${encodeFilename(part.name)}"`;
    }
    if ('type' in part && typeof part.type === 'string') {
      headers['content-type'] = part.type;
    }
  }
  return headers;
}

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
  if (typeof formData.entries !== 'function') {
    // @ts-expect-error: React Native's FormData is not 100% compatible with ours
    if (typeof formData.getParts == 'function') {
      formData.entries = function () {
        // @ts-expect-error
        return formData.getParts().map((part) => {
          if (part.string) return part.string;
          if (part.file) return part.file;
          if (part.blob) return part.blob;
        });
      };
    } else {
      throw new Error('Unsupported FormData implementation');
    }
  }
  // @ts-expect-error: React Native's FormData is not 100% compatible with ours
  const entries: [string, ExpoFormDataValue][] = formData.entries();

  const results: (Uint8Array | string)[] = [];
  for (const [name, entry] of entries) {
    results.push(`--${boundary}\r\n`);
    for (const [headerKey, headerValue] of Object.entries(getFormDataPartHeaders(entry, name))) {
      if (headerValue) {
        results.push(`${headerKey}: ${headerValue}\r\n`);
      }
    }
    results.push(`\r\n`);
    if (typeof entry === 'string') {
      results.push(entry);
    } else if (entry instanceof Blob) {
      results.push(new Uint8Array(await blobToArrayBufferAsync(entry)));
    } else if (typeof entry === 'object' && 'bytes' in entry) {
      // @ts-expect-error: File or ExpoBlob don't extend Blob but implement the interface.
      results.push(await entry.bytes());
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
