import { DocumentPickerOptions, DocumentPickerResult } from './types';
/**
 * Display the system UI for choosing a document. By default, the chosen file is copied to [the app's internal cache directory](filesystem.md#filesystemcachedirectory).
 * > **Notes for Web:** The system UI can only be shown after user activation (e.g. a `Button` press).
 * > Therefore, calling `getDocumentAsync` in `componentDidMount`, for example, will **not** work as
 * > intended. The `cancel` event will not be returned in the browser due to platform restrictions and
 * > inconsistencies across browsers.
 *
 * @return On success returns a promise that fulfils with [`DocumentResult`](#documentresult) object.
 *
 * If the user cancelled the document picking, the promise resolves to `{ type: 'cancel' }`.
 */
export declare function getDocumentAsync({ type, copyToCacheDirectory, multiple, }?: DocumentPickerOptions): Promise<DocumentPickerResult>;
export * from './types';
//# sourceMappingURL=index.d.ts.map