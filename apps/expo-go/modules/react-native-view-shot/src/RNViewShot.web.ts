import type {CaptureOptions} from "./index";

type Html2Canvas = typeof import("html2canvas-pro").default;

let html2canvasPromise: Promise<Html2Canvas> | undefined;

// html2canvas-pro is an optional peer dependency: only web users need it, so
// it is loaded lazily on first capture (and code-split by bundlers). When it
// is not installed, webpack/Metro fail at build time with
// "Can't resolve 'html2canvas-pro'"; the rejection below is the fallback for
// environments that resolve modules at runtime (native ESM, import maps...).
function loadHtml2Canvas(): Promise<Html2Canvas> {
  if (!html2canvasPromise) {
    html2canvasPromise = import("html2canvas-pro").then(
      m => m.default,
      e => {
        html2canvasPromise = undefined;
        throw new Error(
          "react-native-view-shot: html2canvas-pro is required on web. " +
            "Install it with `npm install html2canvas-pro`.\n" +
            (e instanceof Error ? e.message : String(e)),
        );
      },
    );
  }
  return html2canvasPromise;
}

async function captureRef(
  view: HTMLElement,
  options: CaptureOptions,
): Promise<string> {
  if (options.result === "tmpfile") {
    console.warn(
      "Tmpfile is not implemented for web. Try base64 or file.\n" +
        "For compatibility, it currently returns the same result as data-uri",
    );
  }

  // TODO: implement snapshotContentContainer option

  const html2canvas = await loadHtml2Canvas();
  const h2cOptions = {
    useCORS: true,
  };
  let renderedCanvas = await html2canvas(view, h2cOptions);

  if (options.width && options.height) {
    // Resize result
    const resizedCanvas = document.createElement("canvas");
    const resizedContext = resizedCanvas.getContext("2d");
    if (!resizedContext) {
      throw new Error("Failed to get 2d context from canvas");
    }
    resizedCanvas.height = options.height;
    resizedCanvas.width = options.width;
    resizedContext.drawImage(
      renderedCanvas,
      0,
      0,
      resizedCanvas.width,
      resizedCanvas.height,
    );
    renderedCanvas = resizedCanvas;
  }

  const mimeType =
    "image/" + (options.format === "jpg" ? "jpeg" : options.format);
  const dataUrl = renderedCanvas.toDataURL(mimeType, options.quality);
  if (options.result === "data-uri" || options.result === "tmpfile")
    return dataUrl;
  return dataUrl.replace(/data:image\/(\w+);base64,/, "");
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
