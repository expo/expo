type RawExifValue = number | number[] | string | Uint8Array;

type TagDictionary = Record<number, string>;

const TIFF_TAGS: TagDictionary = {
  0x00fe: 'NewSubfileType',
  0x0100: 'ImageWidth',
  0x0101: 'ImageLength',
  0x0102: 'BitsPerSample',
  0x0103: 'Compression',
  0x0106: 'PhotometricInterpretation',
  0x010e: 'ImageDescription',
  0x010f: 'Make',
  0x0110: 'Model',
  0x0112: 'Orientation',
  0x011a: 'XResolution',
  0x011b: 'YResolution',
  0x011c: 'PlanarConfiguration',
  0x0128: 'ResolutionUnit',
  0x0131: 'Software',
  0x0132: 'DateTime',
  0x013b: 'Artist',
  0x013e: 'WhitePoint',
  0x013f: 'PrimaryChromaticities',
  0x0201: 'JPEGInterchangeFormat',
  0x0202: 'JPEGInterchangeFormatLength',
  0x0211: 'YCbCrCoefficients',
  0x0214: 'ReferenceBlackWhite',
  0x8298: 'Copyright',
};

const EXIF_TAGS: TagDictionary = {
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8822: 'ExposureProgram',
  0x8824: 'SpectralSensitivity',
  0x8827: 'ISOSpeedRatings',
  0x8828: 'OECF',
  0x9000: 'ExifVersion',
  0x9003: 'DateTimeOriginal',
  0x9004: 'DateTimeDigitized',
  0x9101: 'ComponentsConfiguration',
  0x9102: 'CompressedBitsPerPixel',
  0x9201: 'ShutterSpeedValue',
  0x9202: 'ApertureValue',
  0x9203: 'BrightnessValue',
  0x9204: 'ExposureBiasValue',
  0x9205: 'MaxApertureValue',
  0x9206: 'SubjectDistance',
  0x9207: 'MeteringMode',
  0x9208: 'LightSource',
  0x9209: 'Flash',
  0x920a: 'FocalLength',
  0x927c: 'MakerNote',
  0x9286: 'UserComment',
  0x9290: 'SubsecTime',
  0x9291: 'SubsecTimeOriginal',
  0x9292: 'SubsecTimeDigitized',
  0xa000: 'FlashpixVersion',
  0xa001: 'ColorSpace',
  0xa002: 'PixelXDimension',
  0xa003: 'PixelYDimension',
  0xa004: 'RelatedSoundFile',
  0xa20b: 'FlashEnergy',
  0xa20c: 'SpatialFrequencyResponse',
  0xa20e: 'FocalPlaneXResolution',
  0xa20f: 'FocalPlaneYResolution',
  0xa210: 'FocalPlaneResolutionUnit',
  0xa215: 'ExposureIndex',
  0xa300: 'FileSource',
  0xa301: 'SceneType',
  0xa302: 'CFAPattern',
  0xa401: 'CustomRendered',
  0xa402: 'ExposureMode',
  0xa404: 'DigitalZoomRatio',
  0xa405: 'FocalLengthIn35mmFilm',
  0xa407: 'GainControl',
  0xa408: 'Contrast',
  0xa40b: 'DeviceSettingDescription',
  0xa420: 'ImageUniqueID',
  0xc612: 'DNGVersion',
  0xc620: 'DefaultCropSize',
};

const GPS_TAGS: TagDictionary = {
  0x0000: 'GPSVersionID',
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
  0x0005: 'GPSAltitudeRef',
  0x0006: 'GPSAltitude',
  0x0007: 'GPSTimeStamp',
  0x0008: 'GPSSatellites',
  0x0009: 'GPSStatus',
  0x000a: 'GPSMeasureMode',
  0x000b: 'GPSDOP',
  0x000c: 'GPSSpeedRef',
  0x000d: 'GPSSpeed',
  0x000e: 'GPSTrackRef',
  0x000f: 'GPSTrack',
  0x0010: 'GPSImgDirectionRef',
  0x0011: 'GPSImgDirection',
  0x0012: 'GPSMapDatum',
  0x0013: 'GPSDestLatitudeRef',
  0x0014: 'GPSDestLatitude',
  0x0015: 'GPSDestLongitudeRef',
  0x0016: 'GPSDestLongitude',
  0x0017: 'GPSDestBearingRef',
  0x0018: 'GPSDestBearing',
  0x0019: 'GPSDestDistanceRef',
  0x001a: 'GPSDestDistance',
  0x001b: 'GPSProcessingMethod',
  0x001c: 'GPSAreaInformation',
  0x001d: 'GPSDateStamp',
  0x001e: 'GPSDifferential',
  0x001f: 'GPSHPositioningError',
};

const INTEROPERABILITY_TAGS: TagDictionary = {
  0x0001: 'InteroperabilityIndex',
};

const EXIF_IFD_POINTER = 0x8769;
const GPS_IFD_POINTER = 0x8825;
const INTEROPERABILITY_IFD_POINTER = 0xa005;

const BYTE_ORDER_BIG_ENDIAN = 0x4d4d;
const BYTE_ORDER_LITTLE_ENDIAN = 0x4949;

export async function readExifFromFileAsync(file: Blob): Promise<Record<string, any> | null> {
  const buffer = await readBlobAsArrayBufferAsync(file);
  return readExifFromBuffer(buffer);
}

function readExifFromBuffer(buffer: ArrayBuffer): Record<string, any> | null {
  const view = new DataView(buffer);

  if (isJpeg(view)) {
    return normalizeExifData(parseJpegExif(view));
  }
  if (isPng(view)) {
    return normalizeExifData(parsePngExif(view));
  }
  if (isWebP(view)) {
    return normalizeExifData(parseWebPExif(view));
  }
  if (isTiff(view)) {
    return normalizeExifData(parseTiffExif(view, 0, view.byteLength));
  }

  return null;
}

async function readBlobAsArrayBufferAsync(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected media metadata.'));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read the selected media metadata.'));
      }
    };
    reader.readAsArrayBuffer(blob);
  });
}

function isJpeg(view: DataView): boolean {
  return view.byteLength >= 2 && view.getUint16(0, false) === 0xffd8;
}

function isPng(view: DataView): boolean {
  return (
    view.byteLength >= 8 &&
    view.getUint32(0, false) === 0x89504e47 &&
    view.getUint32(4, false) === 0x0d0a1a0a
  );
}

function isWebP(view: DataView): boolean {
  return (
    view.byteLength >= 12 && readAscii(view, 0, 4) === 'RIFF' && readAscii(view, 8, 4) === 'WEBP'
  );
}

function isTiff(view: DataView): boolean {
  if (view.byteLength < 8) {
    return false;
  }

  const byteOrder = view.getUint16(0, false);
  const littleEndian = byteOrder === BYTE_ORDER_LITTLE_ENDIAN;
  const bigEndian = byteOrder === BYTE_ORDER_BIG_ENDIAN;

  if (!littleEndian && !bigEndian) {
    return false;
  }

  return view.getUint16(2, littleEndian) === 42;
}

function parseJpegExif(view: DataView): Record<string, RawExifValue> | null {
  let offset = 2;

  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      break;
    }

    const marker = view.getUint8(offset + 1);

    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    const segmentLength = view.getUint16(offset + 2, false);

    if (segmentLength < 2) {
      break;
    }

    const segmentStart = offset + 4;
    const segmentDataLength = segmentLength - 2;
    const segmentEnd = segmentStart + segmentDataLength;

    if (segmentEnd > view.byteLength) {
      break;
    }

    if (marker === 0xe1) {
      const exif = parseExifPayload(view, segmentStart, segmentDataLength);
      if (exif != null) {
        return exif;
      }
    }

    offset += segmentLength + 2;
  }

  return null;
}

function parsePngExif(view: DataView): Record<string, RawExifValue> | null {
  let offset = 8;

  while (offset + 12 <= view.byteLength) {
    const chunkLength = view.getUint32(offset, false);
    const chunkType = readAscii(view, offset + 4, 4);
    const chunkDataOffset = offset + 8;
    const chunkEnd = chunkDataOffset + chunkLength;

    if (chunkEnd + 4 > view.byteLength) {
      break;
    }

    if (chunkType === 'eXIf') {
      return parseExifPayload(view, chunkDataOffset, chunkLength);
    }

    offset = chunkEnd + 4;
  }

  return null;
}

function parseWebPExif(view: DataView): Record<string, RawExifValue> | null {
  let offset = 12;

  while (offset + 8 <= view.byteLength) {
    const chunkType = readAscii(view, offset, 4);
    const chunkLength = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;
    const paddedLength = chunkLength + (chunkLength % 2);

    if (chunkDataOffset + paddedLength > view.byteLength) {
      break;
    }

    if (chunkType === 'EXIF') {
      return parseExifPayload(view, chunkDataOffset, chunkLength);
    }

    offset = chunkDataOffset + paddedLength;
  }

  return null;
}

function parseExifPayload(
  view: DataView,
  payloadOffset: number,
  payloadLength: number
): Record<string, RawExifValue> | null {
  if (payloadLength < 8) {
    return null;
  }

  if (payloadLength >= 6 && readAscii(view, payloadOffset, 4) === 'Exif') {
    return parseTiffExif(view, payloadOffset + 6, payloadLength - 6);
  }

  return parseTiffExif(view, payloadOffset, payloadLength);
}

function parseTiffExif(
  view: DataView,
  tiffOffset: number,
  tiffLength: number
): Record<string, RawExifValue> | null {
  if (tiffLength < 8 || tiffOffset + tiffLength > view.byteLength) {
    return null;
  }

  const byteOrder = view.getUint16(tiffOffset, false);
  const littleEndian =
    byteOrder === BYTE_ORDER_LITTLE_ENDIAN
      ? true
      : byteOrder === BYTE_ORDER_BIG_ENDIAN
        ? false
        : null;

  if (littleEndian == null || view.getUint16(tiffOffset + 2, littleEndian) !== 42) {
    return null;
  }

  const rawExif: Record<string, RawExifValue> = {};
  const tiffEnd = tiffOffset + tiffLength;
  const visited = new Set<string>();

  const parseIfd = (relativeOffset: number, tags: TagDictionary, scope: string): void => {
    if (relativeOffset <= 0) {
      return;
    }

    const absoluteOffset = tiffOffset + relativeOffset;
    const visitKey = `${scope}:${relativeOffset}`;

    if (visited.has(visitKey) || absoluteOffset + 2 > tiffEnd) {
      return;
    }
    visited.add(visitKey);

    const entryCount = view.getUint16(absoluteOffset, littleEndian);
    const afterEntries = absoluteOffset + 2 + entryCount * 12;

    if (afterEntries + 4 > tiffEnd) {
      return;
    }

    const childIfds: { offset: number; scope: string; tags: TagDictionary }[] = [];

    for (let index = 0; index < entryCount; index += 1) {
      const entryOffset = absoluteOffset + 2 + index * 12;
      const tagId = view.getUint16(entryOffset, littleEndian);

      if (
        tagId === EXIF_IFD_POINTER ||
        tagId === GPS_IFD_POINTER ||
        tagId === INTEROPERABILITY_IFD_POINTER
      ) {
        const childOffset = readOffsetValue(view, entryOffset, littleEndian);

        if (childOffset != null) {
          if (tagId === EXIF_IFD_POINTER) {
            childIfds.push({ offset: childOffset, scope: 'exif', tags: EXIF_TAGS });
          } else if (tagId === GPS_IFD_POINTER) {
            childIfds.push({ offset: childOffset, scope: 'gps', tags: GPS_TAGS });
          } else {
            childIfds.push({ offset: childOffset, scope: 'interop', tags: INTEROPERABILITY_TAGS });
          }
        }
        continue;
      }

      const tagName = tags[tagId] ?? `Tag_0x${tagId.toString(16).toUpperCase().padStart(4, '0')}`;
      const value = readTagValue(view, entryOffset, tiffOffset, tiffEnd, littleEndian);

      if (value != null) {
        rawExif[tagName] = value;
      }
    }

    for (const childIfd of childIfds) {
      parseIfd(childIfd.offset, childIfd.tags, childIfd.scope);
    }

    if (scope === 'tiff') {
      const nextIfdOffset = view.getUint32(afterEntries, littleEndian);
      if (nextIfdOffset !== 0) {
        parseIfd(nextIfdOffset, TIFF_TAGS, 'tiff-next');
      }
    }
  };

  const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
  parseIfd(firstIfdOffset, TIFF_TAGS, 'tiff');

  return Object.keys(rawExif).length > 0 ? rawExif : null;
}

function readOffsetValue(
  view: DataView,
  entryOffset: number,
  littleEndian: boolean
): number | null {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);

  if (count !== 1 || (type !== 3 && type !== 4)) {
    return null;
  }

  return type === 3
    ? view.getUint16(entryOffset + 8, littleEndian)
    : view.getUint32(entryOffset + 8, littleEndian);
}

function readTagValue(
  view: DataView,
  entryOffset: number,
  tiffOffset: number,
  tiffEnd: number,
  littleEndian: boolean
): RawExifValue | null {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);
  const unitSize = getUnitSize(type);

  if (count === 0 || unitSize == null) {
    return null;
  }

  const totalSize = unitSize * count;
  const valueOffset =
    totalSize <= 4 ? entryOffset + 8 : tiffOffset + view.getUint32(entryOffset + 8, littleEndian);

  if (valueOffset < tiffOffset || valueOffset + totalSize > tiffEnd) {
    return null;
  }

  switch (type) {
    case 1:
      return readUnsignedBytes(view, valueOffset, count);
    case 2:
      return trimTrailingNulls(readAscii(view, valueOffset, count));
    case 3:
      return readNumberArray(view, valueOffset, count, 2, littleEndian, (offset) =>
        view.getUint16(offset, littleEndian)
      );
    case 4:
      return readNumberArray(view, valueOffset, count, 4, littleEndian, (offset) =>
        view.getUint32(offset, littleEndian)
      );
    case 5:
      return readRationalArray(view, valueOffset, count, littleEndian, false);
    case 6:
      return readNumberArray(view, valueOffset, count, 1, littleEndian, (offset) =>
        view.getInt8(offset)
      );
    case 7:
      return new Uint8Array(view.buffer.slice(valueOffset, valueOffset + count));
    case 8:
      return readNumberArray(view, valueOffset, count, 2, littleEndian, (offset) =>
        view.getInt16(offset, littleEndian)
      );
    case 9:
      return readNumberArray(view, valueOffset, count, 4, littleEndian, (offset) =>
        view.getInt32(offset, littleEndian)
      );
    case 10:
      return readRationalArray(view, valueOffset, count, littleEndian, true);
    case 11:
      return readNumberArray(view, valueOffset, count, 4, littleEndian, (offset) =>
        view.getFloat32(offset, littleEndian)
      );
    case 12:
      return readNumberArray(view, valueOffset, count, 8, littleEndian, (offset) =>
        view.getFloat64(offset, littleEndian)
      );
    default:
      return null;
  }
}

function getUnitSize(type: number): number | null {
  switch (type) {
    case 1:
    case 2:
    case 6:
    case 7:
      return 1;
    case 3:
    case 8:
      return 2;
    case 4:
    case 9:
    case 11:
      return 4;
    case 5:
    case 10:
    case 12:
      return 8;
    default:
      return null;
  }
}

function readUnsignedBytes(view: DataView, offset: number, count: number): number | number[] {
  const values = Array.from({ length: count }, (_, index) => view.getUint8(offset + index));
  const first = values[0];
  return values.length === 1 && first !== undefined ? first : values;
}

function readNumberArray(
  view: DataView,
  offset: number,
  count: number,
  step: number,
  _littleEndian: boolean,
  reader: (offset: number) => number
): number | number[] {
  const values = Array.from({ length: count }, (_, index) => reader(offset + index * step));
  const first = values[0];
  return values.length === 1 && first !== undefined ? first : values;
}

function readRationalArray(
  view: DataView,
  offset: number,
  count: number,
  littleEndian: boolean,
  signed: boolean
): number | number[] {
  const values = Array.from({ length: count }, (_, index) => {
    const baseOffset = offset + index * 8;
    const numerator = signed
      ? view.getInt32(baseOffset, littleEndian)
      : view.getUint32(baseOffset, littleEndian);
    const denominator = signed
      ? view.getInt32(baseOffset + 4, littleEndian)
      : view.getUint32(baseOffset + 4, littleEndian);

    return denominator === 0 ? 0 : numerator / denominator;
  });

  const first = values[0];
  return values.length === 1 && first !== undefined ? first : values;
}

function normalizeExifData(
  rawExif: Record<string, RawExifValue> | null
): Record<string, any> | null {
  if (rawExif == null) {
    return null;
  }

  const exif: Record<string, any> = {};
  const latitudeRef = normalizeString(rawExif.GPSLatitudeRef);
  const longitudeRef = normalizeString(rawExif.GPSLongitudeRef);
  const altitudeRef = normalizeNumber(rawExif.GPSAltitudeRef);

  for (const [tagName, rawValue] of Object.entries(rawExif)) {
    if (tagName === 'GPSLatitude') {
      const latitude = normalizeGpsCoordinate(rawValue, latitudeRef);
      if (latitude != null) {
        exif[tagName] = latitude;
      }
      continue;
    }

    if (tagName === 'GPSLongitude') {
      const longitude = normalizeGpsCoordinate(rawValue, longitudeRef);
      if (longitude != null) {
        exif[tagName] = longitude;
      }
      continue;
    }

    if (tagName === 'GPSAltitude') {
      const altitude = normalizeNumber(rawValue);
      if (altitude != null) {
        exif[tagName] = altitudeRef === 1 ? -altitude : altitude;
      }
      continue;
    }

    if (tagName === 'GPSVersionID' && Array.isArray(rawValue)) {
      exif[tagName] = rawValue.join('.');
      continue;
    }

    exif[tagName] = normalizeGenericValue(rawValue);
  }

  return Object.keys(exif).length > 0 ? exif : null;
}

function normalizeGpsCoordinate(
  rawValue: RawExifValue,
  directionRef: string | null
): number | null {
  const values = Array.isArray(rawValue)
    ? rawValue
    : typeof rawValue === 'number'
      ? [rawValue]
      : null;

  if (values == null || values.length === 0) {
    return null;
  }

  const degrees = values[0] ?? 0;
  const minutes = values[1] ?? 0;
  const seconds = values[2] ?? 0;
  const coordinate = degrees + minutes / 60 + seconds / 3600;
  const direction = directionRef?.toUpperCase();

  return direction === 'S' || direction === 'W' ? -coordinate : coordinate;
}

function normalizeGenericValue(rawValue: RawExifValue): any {
  if (typeof rawValue === 'string' || typeof rawValue === 'number') {
    return rawValue;
  }

  if (rawValue instanceof Uint8Array) {
    return formatByteValue(rawValue);
  }

  return rawValue;
}

function normalizeString(rawValue: RawExifValue | undefined): string | null {
  if (rawValue == null) {
    return null;
  }

  if (typeof rawValue === 'string') {
    return rawValue;
  }

  if (rawValue instanceof Uint8Array) {
    const formatted = formatByteValue(rawValue);
    return Array.isArray(formatted) ? formatted.join('.') : formatted;
  }

  if (Array.isArray(rawValue)) {
    const first = rawValue[0];
    return first != null ? String(first) : null;
  }

  return String(rawValue);
}

function normalizeNumber(rawValue: RawExifValue | undefined): number | null {
  if (rawValue == null) {
    return null;
  }

  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : null;
  }

  if (Array.isArray(rawValue)) {
    const first = rawValue[0];
    return typeof first === 'number' && Number.isFinite(first) ? first : null;
  }

  if (rawValue instanceof Uint8Array) {
    const first = rawValue[0];
    return typeof first === 'number' ? first : null;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatByteValue(bytes: Uint8Array): string | number[] {
  if (bytes.length === 0) {
    return '';
  }

  if (Array.from(bytes).every((value) => value === 0 || (value >= 32 && value <= 126))) {
    return trimTrailingNulls(decodeBytes(bytes));
  }

  return Array.from(bytes);
}

function readAscii(view: DataView, offset: number, length: number): string {
  return decodeBytes(new Uint8Array(view.buffer, view.byteOffset + offset, length));
}

function decodeBytes(bytes: Uint8Array): string {
  if (typeof globalThis.TextDecoder === 'function') {
    return new globalThis.TextDecoder().decode(bytes);
  }

  let result = '';
  for (const value of bytes) {
    result += String.fromCharCode(value);
  }
  return result;
}

function trimTrailingNulls(value: string): string {
  return value.replace(/\0+$/g, '');
}
