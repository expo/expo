import ExpoDocumentPicker from './ExpoDocumentPicker';
export async function getDocumentAsync({ type = '*/*', copyToCacheDirectory = true, multiple = false, } = {}) {
    if (typeof type === 'string') {
        type = [type];
    }
    return await ExpoDocumentPicker.getDocumentAsync({ type, copyToCacheDirectory, multiple });
}
//# sourceMappingURL=index.js.map