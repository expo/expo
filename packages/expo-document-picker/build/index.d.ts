import { DocumentPickerOptions, DocumentResult } from './types';
export { DocumentPickerOptions, DocumentResult };
export declare function getDocumentAsync({ type, copyToCacheDirectory, multiple, }?: DocumentPickerOptions): Promise<DocumentResult>;
