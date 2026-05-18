"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isModalPresentation = isModalPresentation;
const MODAL_PRESENTATIONS = [
    'modal',
    'transparentModal',
    'fullScreenModal',
    'formSheet',
    'pageSheet',
    'containedModal',
    'containedTransparentModal',
];
/**
 * Helper to determine if a given screen should be treated as a modal-type presentation
 *
 * @param options - The navigation options.
 * @returns Whether the screen should be treated as a modal-type presentation.
 *
 * @internal
 */
function isModalPresentation(options) {
    const presentation = options?.presentation;
    if (!presentation) {
        return false;
    }
    return MODAL_PRESENTATIONS.includes(presentation);
}
//# sourceMappingURL=stackPresentation.js.map