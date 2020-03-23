import NativeBlobModule from 'react-native/Libraries/Blob/NativeBlobModule';
import { URL, URLSearchParams } from 'whatwg-url-without-unicode';

let blobUrlPrefix: string | null = null;

if (NativeBlobModule && typeof NativeBlobModule.getConstants().BLOB_URI_SCHEME === 'string') {
  const constants = NativeBlobModule.getConstants();
  blobUrlPrefix = constants.BLOB_URI_SCHEME + ':';
  if (typeof constants.BLOB_URI_HOST === 'string') {
    blobUrlPrefix += `//${constants.BLOB_URI_HOST}/`;
  }
}

URL.createObjectURL = (blob: any): string => {
  if (blobUrlPrefix === null) {
    throw new Error(`Failed to generate URL from blob: ${blob}`);
  }
  return `${blobUrlPrefix}${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.size}`;
};

URL.revokeObjectURL = () => {};

export { URL, URLSearchParams };
