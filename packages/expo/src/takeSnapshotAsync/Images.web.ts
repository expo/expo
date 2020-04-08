import { batchProcessAllSourcesAsync } from './ProcessSources.web';
import {
  getSourceAndEncodeAsync,
  formatDataAsUrl,
  isDataUrl,
  getMimeTypeFromSource,
} from './Utils.web';

export async function processAllImagesAsync(element: HTMLElement): Promise<void> {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  await processAndMutateNodeBackgroundImageAsync(element);

  if (element instanceof HTMLImageElement) {
    await loadNewImageAsync(element);
  } else {
    const children: any[] = Array.from(element.childNodes);
    await Promise.all(children.map(child => batchProcessAllSourcesAsync(child)));
  }
}

async function processAndMutateNodeBackgroundImageAsync(element: HTMLElement): Promise<void> {
  const background = element.style.getPropertyValue('background');
  if (background) {
    const backgroundPropertyValue = await batchProcessAllSourcesAsync(background);
    const currentElementBackgroundPriority = element.style.getPropertyPriority('background');
    element.style.setProperty(
      'background',
      backgroundPropertyValue,
      currentElementBackgroundPriority
    );
  }
}

async function loadNewImageAsync(element: HTMLImageElement): Promise<any> {
  if (isDataUrl(element.src)) {
    return;
  }

  const data = await getSourceAndEncodeAsync(element.src);
  const dataUrl = formatDataAsUrl(data, getMimeTypeFromSource(element.src));
  return new Promise((resolve, reject) => {
    element.onload = () => resolve();
    element.onerror = () => {
      reject(new Error(`Image could not be loaded: ${element.src}`));
    };
    element.src = dataUrl;
  });
}
