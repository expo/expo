import { Platform } from 'expo-modules-core';

import {
  defaultDocumentPickerOptions,
  DocumentPickerOptions,
  MultipleDocumentsPickResult,
  SingleDocumentPickResult,
} from './types';

export default {
  async getDocumentAsync({
    mimeType,
    multiple,
  }: DocumentPickerOptions & { multiple: boolean }): Promise<MultipleDocumentsPickResult> {
    // SSR guard
    if (!Platform.isDOMAvailable) {
      return { canceled: true, pickedFiles: null };
    }

    const input = document.createElement('input');
    input.style.display = 'none';
    input.setAttribute('type', 'file');
    input.setAttribute('accept', Array.isArray(mimeType) ? mimeType.join(',') : mimeType);
    input.setAttribute('id', String(Math.random()));
    if (multiple) {
      input.setAttribute('multiple', 'multiple');
    }

    document.body.appendChild(input);

    return new Promise((resolve) => {
      input.addEventListener('change', async () => {
        if (input.files) {
          const results: File[] = Array.from(input.files);
          resolve({ canceled: false, pickedFiles: results });
        } else {
          resolve({ canceled: true, pickedFiles: null });
        }

        document.body.removeChild(input);
      });

      input.addEventListener('cancel', () => {
        resolve({ canceled: true, pickedFiles: null });
      });

      const event = new MouseEvent('click');
      input.dispatchEvent(event);
    });
  },

  async getSingleDocument({
    mimeType,
    copyToCacheDirectory,
  }: DocumentPickerOptions = defaultDocumentPickerOptions): Promise<SingleDocumentPickResult> {
    const result: MultipleDocumentsPickResult = await this.getDocumentAsync({
      mimeType,
      copyToCacheDirectory,
      multiple: false,
    });
    const pickedFile = result.pickedFiles?.[0];
    if (result.canceled || !pickedFile) {
      return { canceled: true, pickedFile: null };
    }
    return { canceled: false, pickedFile: pickedFile as File };
  },

  async getMultipleDocuments({
    mimeType,
    copyToCacheDirectory,
  }: DocumentPickerOptions = defaultDocumentPickerOptions): Promise<MultipleDocumentsPickResult> {
    return this.getDocumentAsync({
      mimeType,
      copyToCacheDirectory,
      multiple: true,
    });
  },
};
