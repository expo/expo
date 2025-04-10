//@flow
import html2canvas from "html2canvas";

async function captureRef(view, options) {
  if (options.result === "tmpfile") {
    console.warn("Tmpfile is not implemented for web. Try base64 or file.\n"+
                 "For compatibility, it currently returns the same result as data-uri");
  }

  // TODO: implement snapshotContentContainer option

  const h2cOptions = {};
  let renderedCanvas = await html2canvas(view, h2cOptions);

  if (options.width && options.height) {
    // Resize result
    const resizedCanvas = document.createElement('canvas');
    const resizedContext = resizedCanvas.getContext('2d');
    resizedCanvas.height = options.height;
    resizedCanvas.width = options.width;
    resizedContext.drawImage(renderedCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    renderedCanvas = resizedCanvas;
  }

  const dataUrl = renderedCanvas.toDataURL("image/" + options.format, options.quality);
  if (options.result === "data-uri" || options.result === "tmpfile") return dataUrl;
  return dataUrl.replace(/data:image\/(\w+);base64,/, '');
}

function captureScreen(options) {
  return captureRef(window.document.body, options);
}

function releaseCapture(uri) {
  throw new Error("Tmpfile is not implemented for web. Try base64 or file");
}

export default {
  captureRef,
  captureScreen,
  releaseCapture
}