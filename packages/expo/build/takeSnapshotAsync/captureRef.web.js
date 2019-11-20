import { findDOMNode } from 'react-dom';
import * as Creator from './Creator.web';
/**
 * Taking a snapshot of DOM is not part of native browser behavior.
 * This is a hack to best emulate mobile functionality.
 * This implementation is based on https://github.com/pbakaus/domvas by Paul Bakaus http://paulbakaus.com/
 */
export default async function captureRef(component, options = {}) {
    const element = getElement(component || document.body);
    const { format = 'png' } = options;
    const finalFormat = format.toLowerCase();
    switch (finalFormat) {
        case 'jpg':
            return Creator.createJPEGAsync(element, options);
        case 'png':
            return Creator.createPNGAsync(element, options);
        case 'raw':
            return Creator.createPixelDataAsync(element, options);
        case 'svg':
            return Creator.createSVGAsync(element, options);
        case 'blob':
            return Creator.createBlobAsync(element, options);
        default:
            throw new Error(`takeSnapshotAsync: Unsupported format: ${finalFormat}`);
    }
}
const getElement = component => {
    try {
        return findDOMNode(component);
    }
    catch (e) {
        return component;
    }
};
//# sourceMappingURL=captureRef.web.js.map