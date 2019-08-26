import { getSourceAndEncodeAsync, formatDataAsUrl, isDataUrl, getMimeTypeFromSource, } from './Utils.web';
import { batchProcessAllSourcesAsync } from './ProcessSources.web';
export async function processAllImagesAsync(element) {
    if (!(element instanceof HTMLElement)) {
        return;
    }
    await processAndMutateNodeBackgroundImageAsync(element);
    if (element instanceof HTMLImageElement) {
        await loadNewImageAsync(element);
    }
    else {
        const children = Array.from(element.childNodes);
        await Promise.all(children.map(child => batchProcessAllSourcesAsync(child)));
    }
}
async function processAndMutateNodeBackgroundImageAsync(element) {
    const background = element.style.getPropertyValue('background');
    if (background) {
        const backgroundPropertyValue = await batchProcessAllSourcesAsync(background);
        const currentElementBackgroundPriority = element.style.getPropertyPriority('background');
        element.style.setProperty('background', backgroundPropertyValue, currentElementBackgroundPriority);
    }
}
async function loadNewImageAsync(element) {
    if (isDataUrl(element.src)) {
        return;
    }
    const data = await getSourceAndEncodeAsync(element.src);
    const dataUrl = formatDataAsUrl(data, getMimeTypeFromSource(element.src));
    return new Promise((resolve, reject) => {
        element.onload = () => resolve();
        element.onerror = () => {
            reject(`Image could not be loaded ${element.src}`);
        };
        element.src = dataUrl;
    });
}
//# sourceMappingURL=Images.web.js.map