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
    let originalCreateElement: any;
    beforeAll(() => {
      originalCreateElement = globalThis.document.createElement;
      globalThis.document.createElement = (function (create) {
        return function (this: typeof create, ...args: any[]) {
          const element: HTMLElement = create.apply(this, args);

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
    });

    afterAll(() => {
      globalThis.document.createElement = originalCreateElement;
    });

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
          {
            fileName: 'hello.png',
            height: 0,
            width: 0,
            mimeType: 'image/png',
            uri: 'data:image/png;base64,aGVsbG8=',
          },
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
  });
});

function getTestImageFile(name = 'hello') {
  return new File([name], `${name}.png`, {
    type: 'image/png',
    lastModified: new Date('2000-10-31T01:30:00.000-05:00').getTime(),
  });
}
