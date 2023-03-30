import ExpoDocumentPicker from './ExpoDocumentPicker';
import { DocumentPickerOptions, DocumentPickerResult } from './types';
export { DocumentPickerOptions, DocumentPickerResult as DocumentResult };

const DEPRECATED_RESULT_KEYS = [
  'name',
  'size',
  'uri',
  'mimeType',
  'lastModified',
  'file',
  'output',
];

function mergeDeprecatedResult(result: DocumentPickerResult): DocumentPickerResult {
  const firstAsset = result.assets?.[0];
  const deprecatedResult = {
    ...result,
    get type() {
      console.warn(
        'Key "type" in the document picker result is deprecated and will be removed in SDK 49, use "canceled" instead'
      );
      return this.canceled ? 'cancel' : 'success';
    },
  };
  for (const key of DEPRECATED_RESULT_KEYS) {
    Object.defineProperty(deprecatedResult, key, {
      get() {
        console.warn(
          `Key "${key}" in the document picker result is deprecated and will be removed in SDK 49, you can access selected assets through the "assets" array instead`
        );
        return firstAsset?.[key];
      },
    });
  }
  return deprecatedResult;
}

// @needsAudit
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
export async function getDocumentAsync({
  type = '*/*',
  copyToCacheDirectory = true,
  multiple = false,
}: DocumentPickerOptions = {}): Promise<DocumentPickerResult> {
  if (typeof type === 'string') {
    type = [type] as string[];
  }
  const result = await ExpoDocumentPicker.getDocumentAsync({
    type,
    copyToCacheDirectory,
    multiple,
  });
  return mergeDeprecatedResult(result);
}
