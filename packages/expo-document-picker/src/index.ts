import ExpoDocumentPicker from './ExpoDocumentPicker';
import { DocumentPickerOptions, DocumentResult } from './types';
export { DocumentPickerOptions, DocumentResult };

export async function getDocumentAsync({
  type = '*/*',
  copyToCacheDirectory = true,
  multiple = false,
}: DocumentPickerOptions = {}): Promise<DocumentResult> {
  if (typeof type === 'string') {
    type = [type] as string[];
  }
  return await ExpoDocumentPicker.getDocumentAsync({ type, copyToCacheDirectory, multiple });
}
