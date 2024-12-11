/**
 * Converts a Blob to an ArrayBuffer.
 */
export function blobToArrayBufferAsync(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return legacyBlobToArrayBufferAsync(blob);
}

/**
 * Converts a Blob to an ArrayBuffer using the FileReader API.
 */
export async function legacyBlobToArrayBufferAsync(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}
