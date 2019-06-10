import ExpoDocumentPicker from './ExpoDocumentPicker';

import { GetDocumentOptions, DocumentResult } from './types';
export { DocumentResult };

export async function getDocumentAsync({
  type = '*/*',
  copyToCacheDirectory = true,
  multiple = false,
}: GetDocumentOptions = {}): Promise<DocumentResult> {
  return await ExpoDocumentPicker.getDocumentAsync({ type, copyToCacheDirectory, multiple });
}
