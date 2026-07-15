'use strict';
// crypto shim with a real pure-JS SHA-1 (metro's collect-dependencies hashes
// dependency keys with createHash('sha1')...digest('base64') on the hot path).

function sha1(msg) {
  const ml = msg.length;
  const padded = Math.ceil((ml + 1 + 8) / 64) * 64;
  const buf = new Uint8Array(padded);
  buf.set(msg);
  buf[ml] = 0x80;
  const dv = new DataView(buf.buffer);
  const bitLen = ml * 8;
  dv.setUint32(padded - 8, Math.floor(bitLen / 0x100000000));
  dv.setUint32(padded - 4, bitLen >>> 0);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Int32Array(80);
  for (let i = 0; i < padded; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getInt32(i + j * 4);
    for (let j = 16; j < 80; j++) {
      const n = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
      w[j] = (n << 1) | (n >>> 31);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let j = 0; j < 80; j++) {
      let f, k;
      if (j < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (j < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const t = ((((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0);
      e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = t;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  const out = new Uint8Array(20);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, h0 >>> 0);
  odv.setUint32(4, h1 >>> 0);
  odv.setUint32(8, h2 >>> 0);
  odv.setUint32(12, h3 >>> 0);
  odv.setUint32(16, h4 >>> 0);
  return out;
}

class Hash {
  constructor(algorithm) {
    if (algorithm !== 'sha1') {
      throw new Error("crypto.createHash('" + algorithm + "') is not available in the Hermes runtime (only sha1)");
    }
    this._chunks = [];
  }
  update(data, encoding) {
    if (typeof data === 'string') {
      this._chunks.push(Buffer.from(data, encoding || 'utf8'));
    } else {
      this._chunks.push(data instanceof Uint8Array ? data : new Uint8Array(data));
    }
    return this;
  }
  digest(encoding) {
    const total = this._chunks.reduce((n, c) => n + c.length, 0);
    const all = new Uint8Array(total);
    let off = 0;
    for (const c of this._chunks) { all.set(c, off); off += c.length; }
    const raw = sha1(all);
    const buf = Buffer.from(raw.buffer);
    if (!encoding || encoding === 'buffer') return buf;
    return buf.toString(encoding);
  }
}

function unsupported(name) {
  return function () {
    throw new Error('crypto.' + name + ' is not available in the Hermes runtime');
  };
}

module.exports = {
  createHash: (alg) => new Hash(alg),
  createHmac: unsupported('createHmac'),
  randomBytes: unsupported('randomBytes'),
  randomUUID: unsupported('randomUUID'),
  getRandomValues: unsupported('getRandomValues'),
  webcrypto: globalThis.crypto,
};
