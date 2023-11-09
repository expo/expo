import { FlipType, SaveFormat, } from './ImageManipulator.types';
export function validateArguments(uri, actions, saveOptions) {
    validateUri(uri);
    validateActions(actions);
    validateSaveOptions(saveOptions);
}
export function validateUri(uri) {
    if (!(typeof uri === 'string')) {
        throw new TypeError('The "uri" argument must be a string');
    }
}
export function validateActions(actions) {
    if (!Array.isArray(actions)) {
        throw new TypeError('The "actions" argument must be an array');
    }
    for (const action of actions) {
        if (typeof action !== 'object' || action === null) {
            throw new TypeError('Action must be an object');
        }
        const supportedActionTypes = ['crop', 'extent', 'flip', 'rotate', 'resize'];
        const actionKeys = Object.keys(action);
        if (actionKeys.length !== 1) {
            throw new TypeError(`Single action must contain exactly one transformation: ${supportedActionTypes.join(', ')}`);
        }
        const actionType = actionKeys[0];
        if (!supportedActionTypes.includes(actionType)) {
            throw new TypeError(`Unsupported action type: ${actionType}`);
        }
        if (actionType === 'crop') {
            validateCropAction(action);
        }
        else if (actionType === 'extent') {
            validateExtentAction(action);
        }
        else if (actionType === 'flip') {
            validateFlipAction(action);
        }
        else if (actionType === 'rotate') {
            validateRotateAction(action);
        }
        else if (actionType === 'resize') {
            validateResizeAction(action);
        }
    }
}
function validateCropAction(action) {
    const isValid = typeof action.crop === 'object' &&
        action.crop !== null &&
        typeof action.crop.originX === 'number' &&
        typeof action.crop.originY === 'number' &&
        typeof action.crop.width === 'number' &&
        typeof action.crop.height === 'number';
    if (!isValid) {
        throw new TypeError('Crop action must be an object of shape { originX: number; originY: number; width: number; height: number }');
    }
}
function validateExtentAction(action) {
    const isValid = typeof action.extent === 'object' &&
        action.extent !== null &&
        (action.extent.backgroundColor == null || typeof action.extent.backgroundColor === 'string') &&
        (action.extent.originX == null || typeof action.extent.originX === 'number') &&
        (action.extent.originY == null || typeof action.extent.originY === 'number') &&
        typeof action.extent.width === 'number' &&
        typeof action.extent.height === 'number';
    if (!isValid) {
        throw new TypeError('Extent action must be an object of shape { backgroundColor?: string; originX?: number; originY?: number; width: number; height: number }');
    }
}
function validateFlipAction(action) {
    if (typeof action.flip !== 'string' ||
        ![FlipType.Horizontal, FlipType.Vertical].includes(action.flip)) {
        throw new TypeError(`Unsupported flip type: ${action.flip}`);
    }
}
function validateRotateAction(action) {
    if (typeof action.rotate !== 'number') {
        throw new TypeError('Rotation must be a number');
    }
}
function validateResizeAction(action) {
    const isValid = typeof action.resize === 'object' &&
        action.resize !== null &&
        (typeof action.resize.width === 'number' || typeof action.resize.width === 'undefined') &&
        (typeof action.resize.height === 'number' || typeof action.resize.height === 'undefined');
    if (!isValid) {
        throw new TypeError('Resize action must be an object of shape { width?: number; height?: number }');
    }
}
export function validateSaveOptions({ base64, compress, format }) {
    if (base64 !== undefined && typeof base64 !== 'boolean') {
        throw new TypeError('The "base64" argument must be a boolean');
    }
    if (compress !== undefined) {
        if (typeof compress !== 'number') {
            throw new TypeError('The "compress" argument must be a number');
        }
        if (compress < 0 || compress > 1) {
            throw new TypeError('The "compress" argument must be a number between 0 and 1');
        }
    }
    const allowedFormats = [SaveFormat.JPEG, SaveFormat.PNG, SaveFormat.WEBP];
    if (format !== undefined && !allowedFormats.includes(format)) {
        throw new TypeError(`The "format" argument must be one of: ${allowedFormats.join(', ')}`);
    }
}
//# sourceMappingURL=validators.js.map