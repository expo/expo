import ExponentDocumentPicker from './ExponentDocumentPicker';
import { GetDocumentOptions, DocumentResult } from './DocumentPicker.types';

export async function getDocumentAsync({
  type = '*/*',
  copyToCacheDirectory = true,
  multiple = false,
}: GetDocumentOptions = {}): Promise<DocumentResult> {
  return await ExponentDocumentPicker.getDocumentAsync({ type, copyToCacheDirectory, multiple });
}
