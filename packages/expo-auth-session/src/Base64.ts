const keyset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function encodeNoWrap(input: string): string {
  let output = '';
  let i = 0;

  do {
    const chr1 = input.charCodeAt(i++);
    const chr2 = input.charCodeAt(i++);
    const chr3 = input.charCodeAt(i++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;
    if (isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output =
      output +
      keyset.charAt(enc1) +
      keyset.charAt(enc2) +
      keyset.charAt(enc3) +
      keyset.charAt(enc4);
  } while (i < input.length);

  return output;
}
