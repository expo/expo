import { CodedError } from 'expo-modules-core';
import { getContext } from '../utils/getContext.web';
export default (canvas, options) => {
    // ensure values are defined.
    let { originX = 0, originY = 0, width = 0, height = 0 } = options;
    const clamp = (value, max) => Math.max(0, Math.min(max, value));
    // lock within bounds.
    width = clamp(width, canvas.width);
    height = clamp(height, canvas.height);
    originX = clamp(originX, canvas.width);
    originY = clamp(originY, canvas.height);
    // lock sum of crop.
    width = Math.min(originX + width, canvas.width) - originX;
    height = Math.min(originY + height, canvas.height) - originY;
    if (width === 0 || height === 0) {
        throw new CodedError('ERR_IMAGE_MANIPULATOR_CROP', 'Crop size must be greater than 0: ' + JSON.stringify(options, null, 2));
    }
    const result = document.createElement('canvas');
    result.width = width;
    result.height = height;
    const context = getContext(result);
    context.drawImage(canvas, originX, originY, width, height, 0, 0, width, height);
    return result;
};
//# sourceMappingURL=CropAction.web.js.map