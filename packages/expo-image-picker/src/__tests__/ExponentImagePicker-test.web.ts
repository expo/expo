/**
 * @jest-environment jsdom
 */
import { screen, fireEvent } from '@testing-library/react';

import ExponentImagePicker from '../ExponentImagePicker';

describe('ExponentImagePicker', () => {
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
    it(`resolves when user cancel`, () => {
      const pickerPromise = ExponentImagePicker.launchImageLibraryAsync({});
      const fileInput = screen.getByTestId('file-input');

      fireEvent(fileInput, new Event('cancel'));

      expect(pickerPromise).resolves.toEqual({ canceled: true, assets: null });
    });
  });
});
