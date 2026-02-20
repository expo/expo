import ExpoDocumentPicker from './ExpoDocumentPicker';
import {
  DocumentPickerOptions,
  defaultDocumentPickerOptions,
  SingleDocumentPickResult,
  MultipleDocumentsPickResult,
} from './types';

export async function pickSingleDocument({
  mimeType,
  copyToCacheDirectory,
}: DocumentPickerOptions = defaultDocumentPickerOptions): Promise<SingleDocumentPickResult> {
  if (typeof mimeType === 'string') {
    mimeType = [mimeType];
  }
  const { canceled, files } = await ExpoDocumentPicker.getDocumentAsync({
    mimeType,
    copyToCacheDirectory,
    multiple: false,
  });
  const pickedFile = files?.[0];
  // TODO maybe reject promise instead of cancelling?
  return { canceled: canceled && pickedFile, pickedFile };
}

export async function pickMultipleDocuments({
  mimeType,
  copyToCacheDirectory,
}: DocumentPickerOptions = defaultDocumentPickerOptions): Promise<MultipleDocumentsPickResult> {
  if (typeof mimeType === 'string') {
    mimeType = [mimeType];
  }
  return await ExpoDocumentPicker.getDocumentAsync({
    mimeType,
    copyToCacheDirectory,
    multiple: false,
  });
}

/**
 * getDocument() -- ? old api for compatibility ? Can do it I guess
 */

export * from './types';
