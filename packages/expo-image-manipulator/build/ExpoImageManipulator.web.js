import { crop, flip, resize, rotate } from './actions/index.web';
import { getContext } from './utils/getContext.web';
function getResults(canvas, options) {
    let uri;
    if (options) {
        const { format = 'png' } = options;
        if (options.format === 'png' && options.compress !== undefined) {
            console.warn('compress is not supported with png format.');
        }
        const quality = Math.min(1, Math.max(0, options.compress ?? 1));
        uri = canvas.toDataURL('image/' + format, quality);
    }
    else {
        // defaults to PNG with no loss
        uri = canvas.toDataURL();
    }
    return {
        uri,
        width: canvas.width,
        height: canvas.height,
        base64: uri.replace(/^data:image\/\w+;base64,/, ''),
    };
}
function loadImageAsync(uri) {
    return new Promise((resolve, reject) => {
        const imageSource = new Image();
        imageSource.crossOrigin = 'anonymous';
        const canvas = document.createElement('canvas');
        imageSource.onload = () => {
            canvas.width = imageSource.naturalWidth;
            canvas.height = imageSource.naturalHeight;
            const context = getContext(canvas);
            context.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
            resolve(canvas);
        };
        imageSource.onerror = () => reject(canvas);
        imageSource.src = uri;
    });
}
export default {
    get name() {
        return 'ExpoImageManipulator';
    },
    async manipulateAsync(uri, actions = [], options) {
        const originalCanvas = await loadImageAsync(uri);
        const resultCanvas = actions.reduce((canvas, action) => {
            if ('crop' in action) {
                return crop(canvas, action.crop);
            }
            else if ('resize' in action) {
                return resize(canvas, action.resize);
            }
            else if ('flip' in action) {
                return flip(canvas, action.flip);
            }
            else if ('rotate' in action) {
                return rotate(canvas, action.rotate);
            }
            else {
                return canvas;
            }
        }, originalCanvas);
        return getResults(resultCanvas, options);
    },
};
//# sourceMappingURL=ExpoImageManipulator.web.js.map