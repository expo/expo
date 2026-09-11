import html2canvas from 'html2canvas';

import type { CaptureOptions } from './index';

async function captureRef(view: HTMLElement, options: CaptureOptions): Promise<string> {
  if (options.result === 'tmpfile') {
    console.warn(
      'Tmpfile is not implemented for web. Try base64 or file.\n' +
        'For compatibility, it currently returns the same result as data-uri'
    );
  }

  // TODO: implement snapshotContentContainer option

  const h2cOptions = {
    useCORS: true,
  };
  let renderedCanvas = await html2canvas(view, h2cOptions);

  if (options.width && options.height) {
    // Resize result
    const resizedCanvas = document.createElement('canvas');
    const resizedContext = resizedCanvas.getContext('2d');
    if (!resizedContext) {
      throw new Error('Failed to get 2d context from canvas');
    }
    resizedCanvas.height = options.height;
    resizedCanvas.width = options.width;
    resizedContext.drawImage(renderedCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    renderedCanvas = resizedCanvas;
  }

  const mimeType = 'image/' + (options.format === 'jpg' ? 'jpeg' : options.format);
  const dataUrl = renderedCanvas.toDataURL(mimeType, options.quality);
  if (options.result === 'data-uri' || options.result === 'tmpfile') return dataUrl;
  return dataUrl.replace(/data:image\/(\w+);base64,/, '');
}

function captureScreen(options: CaptureOptions): Promise<string> {
  return captureRef(window.document.body, options);
}

function releaseCapture(_uri: string): void {
  // no-op on web: there are no tmp files to clean up
}

export default {
  captureRef,
  captureScreen,
  releaseCapture,
};
