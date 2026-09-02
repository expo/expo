const { Packr } = require('./vendor/msgpackr') as {
  Packr: new (options: { useRecords: boolean; moreTypes: boolean; bundleStrings: boolean }) => {
    encode(value: unknown): Buffer;
    decode(buffer: Buffer): unknown;
  };
};

const packr = new Packr({
  useRecords: true,
  moreTypes: true,
  // NOTE(@kitten): Preserved from the previous msgpackr-backed store for cache-entry performance.
  bundleStrings: true,
});

export function encode(value: unknown): Buffer {
  return packr.encode(value);
}

export function decode(buffer: Buffer): unknown {
  return packr.decode(buffer);
}
