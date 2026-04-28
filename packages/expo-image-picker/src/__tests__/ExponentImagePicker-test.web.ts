/**
 * @jest-environment jsdom
 */
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Platform } from 'expo-modules-core';

import ExponentImagePicker from '../ExponentImagePicker';

describe('ExponentImagePicker', () => {
  if (!Platform.isDOMAvailable) {
    it(`noop`, () => {});
    return;
  }

  let originalCreateElement: any;
  beforeAll(() => {
    originalCreateElement = globalThis.document.createElement;
    globalThis.document.createElement = (function (create) {
      return function (this: typeof create, ...args: any[]) {
        const element: HTMLElement = (create as any).apply(this, args);

        if (element.tagName === 'IMG') {
          setTimeout(() => {
            if (!element.onload) {
              return;
            }

            element.onload(new Event('load'));
          }, 10);
        }
        return element;
      };
    })(document.createElement);

    globalThis.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/nice-blob-url');
  });

  afterAll(() => {
    globalThis.document.createElement = originalCreateElement;
  });

  describe('getMediaLibraryPermissionsAsync', () => {
    it(`is always granted`, async () => {
      const response = await ExponentImagePicker.getMediaLibraryPermissionsAsync(true);
      expect(response.granted).toBeTruthy();
      expect(response.status).toBe('granted');
    });
  });

  describe('requestMediaLibraryPermissionsAsync', () => {
    it(`is always granted`, async () => {
      const response = await ExponentImagePicker.requestMediaLibraryPermissionsAsync(true);
      expect(response.granted).toBeTruthy();
      expect(response.status).toBe('granted');
    });
  });

  describe('launchImageLibraryAsync', () => {
    const getFileInput = () => screen.getByTestId<HTMLInputElement>('file-input');

    it(`resolves when user cancel`, () => {
      const pickerPromise = ExponentImagePicker.launchImageLibraryAsync({});
      const fileInput = getFileInput();

      fireEvent(fileInput, new Event('cancel'));

      expect(pickerPromise).resolves.toEqual({ canceled: true, assets: null });
    });

    it(`resolves when user selects file`, async () => {
      const user = userEvent.setup();
      const file = getTestImageFile('hello');
      const pickerPromise = ExponentImagePicker.launchImageLibraryAsync({});
      const fileInput = getFileInput();

      await user.upload(fileInput, file);

      await expect(pickerPromise).resolves.toMatchObject({
        canceled: false,
        assets: [
          expect.objectContaining({
            fileName: 'hello.png',
            mimeType: 'image/png',
            uri: expect.stringMatching(/^blob:/),
          }),
        ],
      });
    });

    it(`resolves when user selects files`, async () => {
      const user = userEvent.setup();
      const file1 = getTestImageFile('hello');
      const file2 = getTestImageFile('world');
      const pickerPromise = ExponentImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
      });
      const fileInput = getFileInput();

      await user.upload(fileInput, [file1, file2]);

      const pickerResult = await pickerPromise;
      expect(pickerResult).toHaveProperty('canceled', false);
      expect(pickerResult.assets).toHaveLength(2);
    });

    it(`returns EXIF metadata when requested`, async () => {
      const user = userEvent.setup();
      const file = getTestImageFileWithExif('expo-exif');
      const pickerPromise = ExponentImagePicker.launchImageLibraryAsync({ exif: true });
      const fileInput = getFileInput();

      await user.upload(fileInput, file);

      const pickerResult = await pickerPromise;
      expect(pickerResult.canceled).toBe(false);

      const asset = pickerResult.assets?.[0];
      expect(asset?.exif).toMatchObject({
        Make: 'ExpoCam',
        Model: 'Web Picker',
        Orientation: 6,
        DateTimeOriginal: '2026:04:28 10:08:00',
        GPSAltitude: 150,
      });
      expect(asset?.exif?.GPSLatitude).toBeCloseTo(28.6, 6);
      expect(asset?.exif?.GPSLongitude).toBeCloseTo(77.2, 6);
    });

    it(`does not include EXIF metadata unless requested`, async () => {
      const user = userEvent.setup();
      const file = getTestImageFileWithExif('no-exif');
      const pickerPromise = ExponentImagePicker.launchImageLibraryAsync({});
      const fileInput = getFileInput();

      await user.upload(fileInput, file);

      const pickerResult = await pickerPromise;
      expect(pickerResult.canceled).toBe(false);
      expect(pickerResult.assets?.[0]).not.toHaveProperty('exif');
    });
  });

  describe('launchCameraAsync', () => {
    const getFileInput = () => screen.getByTestId<HTMLInputElement>('file-input');

    it(`returns EXIF metadata when requested`, async () => {
      const user = userEvent.setup();
      const file = getTestImageFileWithExif('camera-exif');
      const pickerPromise = ExponentImagePicker.launchCameraAsync({ exif: true });
      const fileInput = getFileInput();

      await user.upload(fileInput, file);

      const pickerResult = await pickerPromise;
      expect(pickerResult.canceled).toBe(false);

      const asset = pickerResult.assets?.[0];
      expect(asset?.exif).toMatchObject({
        Make: 'ExpoCam',
        Model: 'Web Picker',
        Orientation: 6,
      });
      expect(asset?.exif?.GPSLatitude).toBeCloseTo(28.6, 6);
      expect(asset?.exif?.GPSLongitude).toBeCloseTo(77.2, 6);
    });
  });
});

function getTestImageFile(name = 'hello') {
  return new File([name], `${name}.png`, {
    type: 'image/png',
    lastModified: new Date('2000-10-31T01:30:00.000-05:00').getTime(),
  });
}

function getTestImageFileWithExif(name = 'hello') {
  return new File([createJpegWithExifData()], `${name}.jpg`, {
    type: 'image/jpeg',
    lastModified: new Date('2026-04-28T10:08:00.000+05:30').getTime(),
  });
}

type TestIfdEntry = {
  tag: number;
  type: number;
  count: number;
  bytes: number[];
  patchableOffset?: boolean;
};

class ByteWriter {
  private readonly bytes: number[] = [];

  get length(): number {
    return this.bytes.length;
  }

  pushByte(value: number) {
    this.bytes.push(value & 0xff);
  }

  pushBytes(values: number[]) {
    values.forEach((value) => this.pushByte(value));
  }

  pushUint16LE(value: number) {
    this.pushByte(value & 0xff);
    this.pushByte((value >> 8) & 0xff);
  }

  pushUint32LE(value: number) {
    this.pushByte(value & 0xff);
    this.pushByte((value >> 8) & 0xff);
    this.pushByte((value >> 16) & 0xff);
    this.pushByte((value >> 24) & 0xff);
  }

  patchUint32LE(offset: number, value: number) {
    this.bytes[offset] = value & 0xff;
    this.bytes[offset + 1] = (value >> 8) & 0xff;
    this.bytes[offset + 2] = (value >> 16) & 0xff;
    this.bytes[offset + 3] = (value >> 24) & 0xff;
  }

  align(boundary: number) {
    while (this.bytes.length % boundary !== 0) {
      this.pushByte(0);
    }
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

function createJpegWithExifData(): Uint8Array {
  const writer = new ByteWriter();

  writer.pushBytes([0x49, 0x49]);
  writer.pushUint16LE(42);
  writer.pushUint32LE(8);

  const ifd0 = writeIfd(writer, [
    asciiEntry(0x010f, 'ExpoCam'),
    asciiEntry(0x0110, 'Web Picker'),
    shortEntry(0x0112, 6),
    pointerEntry(0x8769),
    pointerEntry(0x8825),
  ]);

  writer.align(2);
  const exifIfdOffset = writer.length;
  writeIfd(writer, [
    asciiEntry(0x9003, '2026:04:28 10:08:00'),
    undefinedEntry(0x9000, [0x30, 0x32, 0x33, 0x32]),
  ]);
  writer.patchUint32LE(ifd0.pointerOffsets[0x8769], exifIfdOffset);

  writer.align(2);
  const gpsIfdOffset = writer.length;
  writeIfd(writer, [
    asciiEntry(0x0001, 'N'),
    rationalEntry(0x0002, [
      [28, 1],
      [36, 1],
      [0, 1],
    ]),
    asciiEntry(0x0003, 'E'),
    rationalEntry(0x0004, [
      [77, 1],
      [12, 1],
      [0, 1],
    ]),
    byteEntry(0x0005, [0]),
    rationalEntry(0x0006, [[150, 1]]),
  ]);
  writer.patchUint32LE(ifd0.pointerOffsets[0x8825], gpsIfdOffset);

  const tiffData = writer.toUint8Array();
  const exifPayload = Uint8Array.from([...asciiBytes('Exif'), 0, 0, ...Array.from(tiffData)]);
  const app1Length = exifPayload.length + 2;

  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe1,
    (app1Length >> 8) & 0xff,
    app1Length & 0xff,
    ...Array.from(exifPayload),
    0xff,
    0xd9,
  ]);
}

function writeIfd(writer: ByteWriter, entries: TestIfdEntry[]) {
  const deferredValues: { patchOffset: number; bytes: number[] }[] = [];
  const pointerOffsets: Record<number, number> = {};

  writer.pushUint16LE(entries.length);

  for (const entry of entries) {
    writer.pushUint16LE(entry.tag);
    writer.pushUint16LE(entry.type);
    writer.pushUint32LE(entry.count);

    if (entry.patchableOffset) {
      pointerOffsets[entry.tag] = writer.length;
      writer.pushUint32LE(0);
      continue;
    }

    if (entry.bytes.length <= 4) {
      writer.pushBytes(entry.bytes);
      for (let index = entry.bytes.length; index < 4; index += 1) {
        writer.pushByte(0);
      }
      continue;
    }

    const patchOffset = writer.length;
    writer.pushUint32LE(0);
    deferredValues.push({ patchOffset, bytes: entry.bytes });
  }

  writer.pushUint32LE(0);

  for (const deferredValue of deferredValues) {
    writer.align(2);
    writer.patchUint32LE(deferredValue.patchOffset, writer.length);
    writer.pushBytes(deferredValue.bytes);
  }

  return { pointerOffsets };
}

function asciiEntry(tag: number, value: string): TestIfdEntry {
  const bytes = [...asciiBytes(value), 0];
  return {
    tag,
    type: 2,
    count: bytes.length,
    bytes,
  };
}

function shortEntry(tag: number, value: number): TestIfdEntry {
  return {
    tag,
    type: 3,
    count: 1,
    bytes: [value & 0xff, (value >> 8) & 0xff],
  };
}

function byteEntry(tag: number, values: number[]): TestIfdEntry {
  return {
    tag,
    type: 1,
    count: values.length,
    bytes: values,
  };
}

function undefinedEntry(tag: number, values: number[]): TestIfdEntry {
  return {
    tag,
    type: 7,
    count: values.length,
    bytes: values,
  };
}

function pointerEntry(tag: number): TestIfdEntry {
  return {
    tag,
    type: 4,
    count: 1,
    bytes: [0, 0, 0, 0],
    patchableOffset: true,
  };
}

function rationalEntry(tag: number, values: [number, number][]): TestIfdEntry {
  const bytes: number[] = [];

  for (const [numerator, denominator] of values) {
    pushUint32LE(bytes, numerator);
    pushUint32LE(bytes, denominator);
  }

  return {
    tag,
    type: 5,
    count: values.length,
    bytes,
  };
}

function asciiBytes(value: string): number[] {
  return Array.from(value, (character) => character.charCodeAt(0));
}

function pushUint32LE(bytes: number[], value: number) {
  bytes.push(value & 0xff);
  bytes.push((value >> 8) & 0xff);
  bytes.push((value >> 16) & 0xff);
  bytes.push((value >> 24) & 0xff);
}
