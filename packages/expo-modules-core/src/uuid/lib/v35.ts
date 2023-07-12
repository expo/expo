import bytesToUuid from './bytesToUuid';

function uuidToBytes(uuid: string) {
  // Note: We assume we're being passed a valid uuid string
  const bytes: number[] = [];
  uuid.replace(/[a-fA-F0-9]{2}/g, (hex: string) => {
    bytes.push(parseInt(hex, 16));
    return '';
  });

  return bytes;
}

function stringToBytes(str: string) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape
  const bytes: number[] = new Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

export default function (
  name: string,
  version: number,
  hashfunc: (bytes: number[] | string) => number[]
) {
  const generateUUID = function (
    value: number[] | string,
    namespace: number[] | string,
    buf?: number[],
    offset?: number
  ): string {
    const off = (buf && offset) || 0;

    if (typeof value == 'string') value = stringToBytes(value);
    if (typeof namespace == 'string') namespace = uuidToBytes(namespace);

    if (!Array.isArray(value)) throw TypeError('value must be an array of bytes');
    if (!Array.isArray(namespace) || namespace.length !== 16)
      throw TypeError('namespace must be uuid string or an Array of 16 byte values');

    // Per 4.3
    const bytes = hashfunc(namespace.concat(value));
    bytes[6] = (bytes[6] & 0x0f) | version;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    if (buf) {
      for (let idx = 0; idx < 16; ++idx) {
        buf[off + idx] = bytes[idx];
      }
    }

    return bytesToUuid(bytes);
  };

  // Function#name is not settable on some platforms (#270)
  try {
    generateUUID.name = name;
  } catch {}

  // Pre-defined namespaces, per Appendix C
  generateUUID.DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  generateUUID.URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

  return generateUUID;
}
