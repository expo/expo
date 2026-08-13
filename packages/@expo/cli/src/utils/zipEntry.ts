import zlib from 'zlib';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_HEADER_SIGNATURE = 0x04034b50;
/** The end-of-central-directory record is 22 bytes plus a comment of at most 0xffff bytes. */
export const EOCD_MAX_LENGTH = 22 + 0xffff;
/** A local file header is 30 bytes plus a name and an extra field of at most 0xffff bytes each. */
export const LOCAL_HEADER_MAX_LENGTH = 30 + 2 * 0xffff;

export type ZipCentralDirectory = {
  entryCount: number;
  /** Byte offset of the central directory from the start of the zip file. */
  offset: number;
  size: number;
};

export type ZipEntryLocation = {
  compressionMethod: number;
  compressedSize: number;
  /** Byte offset of the entry's local file header from the start of the zip file. */
  localHeaderOffset: number;
};

/**
 * Read a single entry from a zip archive in memory (e.g. an asset from an APK).
 * Supports stored and deflated entries; ZIP64 archives are not supported.
 * Returns null when the entry doesn't exist. Throws on malformed archives.
 */
export function readZipEntry(zip: Buffer, entryName: string): Buffer | null {
  const directory = parseEndOfCentralDirectory(zip);
  const location = findCentralDirectoryEntry(
    zip.subarray(directory.offset, directory.offset + directory.size),
    directory.entryCount,
    entryName
  );
  if (!location) {
    return null;
  }
  return readLocalZipEntry(zip.subarray(location.localHeaderOffset), location);
}

/**
 * Locate the central directory from the end-of-central-directory record. `tail` must contain
 * the final bytes of the zip file (at most the last `EOCD_MAX_LENGTH` bytes are scanned), so
 * this also works on a ranged read of just the file tail. Returned offsets are relative to
 * the start of the whole file.
 */
export function parseEndOfCentralDirectory(tail: Buffer): ZipCentralDirectory {
  const scanStart = Math.max(0, tail.length - EOCD_MAX_LENGTH);
  for (let offset = tail.length - 22; offset >= scanStart; offset--) {
    if (tail.readUInt32LE(offset) === EOCD_SIGNATURE) {
      const entryCount = tail.readUInt16LE(offset + 10);
      const size = tail.readUInt32LE(offset + 12);
      const centralDirectoryOffset = tail.readUInt32LE(offset + 16);
      if (entryCount === 0xffff || centralDirectoryOffset === 0xffffffff) {
        throw new Error('ZIP64 archives are not supported');
      }
      return { entryCount, offset: centralDirectoryOffset, size };
    }
  }
  throw new Error('Could not find the zip end-of-central-directory record');
}

/**
 * Find an entry in a central directory. `centralDirectory` must start at the directory's
 * first byte (a ranged read of `ZipCentralDirectory.offset`/`size` provides exactly that).
 */
export function findCentralDirectoryEntry(
  centralDirectory: Buffer,
  entryCount: number,
  entryName: string
): ZipEntryLocation | null {
  let offset = 0;
  for (let i = 0; i < entryCount; i++) {
    if (centralDirectory.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error(`Invalid central directory entry at offset ${offset}`);
    }
    const nameLength = centralDirectory.readUInt16LE(offset + 28);
    const extraLength = centralDirectory.readUInt16LE(offset + 30);
    const commentLength = centralDirectory.readUInt16LE(offset + 32);
    const name = centralDirectory.toString('utf8', offset + 46, offset + 46 + nameLength);

    if (name === entryName) {
      return {
        compressionMethod: centralDirectory.readUInt16LE(offset + 10),
        compressedSize: centralDirectory.readUInt32LE(offset + 20),
        localHeaderOffset: centralDirectory.readUInt32LE(offset + 42),
      };
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

/**
 * Decompress an entry from a buffer that starts at its local file header (a ranged read of
 * `ZipEntryLocation.localHeaderOffset` provides that; the buffer must span the header and the
 * compressed data — `LOCAL_HEADER_MAX_LENGTH + compressedSize` bytes always suffice).
 */
export function readLocalZipEntry(
  local: Buffer,
  { compressionMethod, compressedSize }: Omit<ZipEntryLocation, 'localHeaderOffset'>
): Buffer {
  if (local.readUInt32LE(0) !== LOCAL_HEADER_SIGNATURE) {
    throw new Error('Invalid local file header');
  }
  // Sizes in the local header may be zero (data descriptor); use the central directory values.
  const nameLength = local.readUInt16LE(26);
  const extraLength = local.readUInt16LE(28);
  const dataStart = 30 + nameLength + extraLength;
  const data = local.subarray(dataStart, dataStart + compressedSize);

  switch (compressionMethod) {
    case 0:
      return Buffer.from(data);
    case 8:
      return zlib.inflateRawSync(data);
    default:
      throw new Error(`Unsupported zip compression method: ${compressionMethod}`);
  }
}
