import { DocumentResult, DocumentPickerOptions } from './types';
declare const _default: {
    readonly name: string;
    getDocumentAsync({ type, multiple, }: DocumentPickerOptions): Promise<DocumentResult>;
};
export default _default;
