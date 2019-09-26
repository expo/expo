import ExpoDocumentPicker from './ExpoDocumentPicker';
export async function getDocumentAsync({ type = '*/*', copyToCacheDirectory = true, multiple = false, } = {}) {
    return await ExpoDocumentPicker.getDocumentAsync({ type, copyToCacheDirectory, multiple });
}
//# sourceMappingURL=index.js.map