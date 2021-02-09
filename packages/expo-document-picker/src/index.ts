import ExpoDocumentPicker from './ExpoDocumentPicker';
import { DocumentPickerOptions, DocumentResult } from './types';
export { DocumentPickerOptions, DocumentResult };

export async function getDocumentAsync({
  type = '*/*',
  copyToCacheDirectory = true,
  multiple = false,
}: DocumentPickerOptions = {}): Promise<DocumentResult> {
  return await ExpoDocumentPicker.getDocumentAsync({ type, copyToCacheDirectory, multiple });
}
