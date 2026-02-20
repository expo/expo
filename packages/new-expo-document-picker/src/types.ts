import { File as ExpoFile } from '../../expo-file-system';

export type AnyFile = File | ExpoFile;

export type DocumentPickerOptions = {
  mimeType: string | string[];
  copyToCacheDirectory: boolean;
};

export type SingleDocumentSuccessResult = {
  canceled: false;
  pickedFile: AnyFile;
};

export type SingleDocumentCanceledResult = {
  canceled: true;
  pickedFile: null;
};

export type MultipleDocumentsSuccessResult = {
  canceled: false;
  pickedFiles: AnyFile[];
};

export type MultipleDocumentsCanceledResult = {
  canceled: true;
  pickedFiles: null;
};

export type SingleDocumentPickResult = SingleDocumentSuccessResult | SingleDocumentCanceledResult;
export type MultipleDocumentsPickResult =
  | MultipleDocumentsSuccessResult
  | MultipleDocumentsCanceledResult;

export const defaultDocumentPickerOptions: DocumentPickerOptions = {
  mimeType: '*/*',
  copyToCacheDirectory: true,
};
