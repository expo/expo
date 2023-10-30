import { CodedError } from 'expo-modules-core';
import { getContext } from '../utils/getContext.web';
export default (canvas, options) => {
    // ensure values are defined.
    const { backgroundColor = null, originX = 0, originY = 0, width = 0, height = 0 } = options;
    if (width === 0 || height === 0) {
        throw new CodedError('ERR_IMAGE_MANIPULATOR_EXTENT', 'Extent size must be greater than 0: ' + JSON.stringify(options, null, 2));
    }
    const result = document.createElement('canvas');
    result.width = width;
    result.height = height;
    const sx = originX < 0 ? 0 : originX;
    const sy = originY < 0 ? 0 : originY;
    const sw = originX < 0 ? Math.min(canvas.width, width + originX) : Math.min(canvas.width - originX, width);
    const sh = originY < 0
        ? Math.min(canvas.height, height + originY)
        : Math.min(canvas.height - originY, height);
    const dx = originX < 0 ? -originX : 0;
    const dy = originY < 0 ? -originY : 0;
    const context = getContext(result);
    if (backgroundColor != null) {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width, height);
    }
    context.drawImage(canvas, sx, sy, sw, sh, dx, dy, sw, sh);
    return result;
};
//# sourceMappingURL=ExtentAction.web.js.map