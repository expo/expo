import { GetDocumentOptions, DocumentResult } from './types';
export { DocumentResult };
export declare function getDocumentAsync({ type, copyToCacheDirectory, multiple, }?: GetDocumentOptions): Promise<DocumentResult>;
