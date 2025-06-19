"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isModalPresentation = isModalPresentation;
// Helper to determine if a given screen should be treated as a modal-type presentation
function isModalPresentation(options) {
    const presentation = options?.presentation;
    return (presentation === 'modal' ||
        presentation === 'formSheet' ||
        presentation === 'fullScreenModal' ||
        presentation === 'containedModal');
}
//# sourceMappingURL=utils.js.map