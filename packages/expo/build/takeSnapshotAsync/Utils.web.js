function parseExtension(url) {
    const match = /\.([^\.\/]*?)$/g.exec(url);
    if (match) {
        return match[1].toLowerCase();
    }
    return '';
}
const WOFF = 'application/font-woff';
const JPEG = 'image/jpeg';
const MIME_TYPES = {
    woff: WOFF,
    woff2: WOFF,
    ttf: 'application/font-truetype',
    eot: 'application/vnd.ms-fontobject',
    otf: 'application/font-opentype',
    png: 'image/png',
    jpg: JPEG,
    jpeg: JPEG,
    gif: 'image/gif',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
};
export function getMimeTypeFromSource(url) {
    const extension = parseExtension(url);
    if (extension in MIME_TYPES) {
        return MIME_TYPES[extension];
    }
    throw new Error(`No valid MIME type (${extension}) for url: ${url}`);
}
export function isDataUrl(url) {
    return url.search(/^(data:)/) !== -1;
}
function getBlobFromCanvasElement(canvas) {
    const binaryString = window.atob(canvas.toDataURL().split(',')[1]);
    const length = binaryString.length;
    const binaryArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        binaryArray[i] = binaryString.charCodeAt(i);
    }
    return new Blob([binaryArray], {
        type: 'image/png',
    });
}
export async function getBlobFromCanvasAsync(canvas, quality) {
    if (canvas.toBlob) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (blob == null) {
                    reject('Failed to convert canvas to blob!');
                }
                else {
                    resolve(blob);
                }
            }, '2d', quality);
        });
    }
    return getBlobFromCanvasElement(canvas);
}
export function resolveUrl(url, baseUrl) {
    const doc = document.implementation.createHTMLDocument();
    const base = doc.createElement('base');
    doc.head.appendChild(base);
    const a = doc.createElement('a');
    doc.body.appendChild(a);
    base.href = baseUrl;
    a.href = url;
    return a.href;
}
export function getImageElementFromURIAsync(uri) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            resolve(image);
        };
        image.onerror = () => {
            reject(`Image could not be loaded ${image.src}`);
        };
        image.src = uri;
    });
}
export function getSourceAndEncodeAsync(url, preventCaching = false, missingImageSource = undefined) {
    const TIMEOUT = 30000;
    if (preventCaching) {
        // Cache bypass so we dont have CORS issues with cached images
        // Source: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
        url += (/\?/.test(url) ? '&' : '?') + Date.now();
    }
    return new Promise(resolve => {
        const request = new XMLHttpRequest();
        request.onreadystatechange = done;
        request.ontimeout = timeout;
        request.responseType = 'blob';
        request.timeout = TIMEOUT;
        request.open('GET', url, true);
        request.send();
        let placeholder;
        if (missingImageSource) {
            const split = missingImageSource.split(/,/);
            if (split && split[1]) {
                placeholder = split[1];
            }
        }
        function done() {
            if (request.readyState !== 4) {
                return;
            }
            if (request.status !== 200) {
                if (placeholder) {
                    resolve(placeholder);
                }
                else {
                    fail(`cannot fetch resource: ${url}, status: ${request.status}`);
                }
                return;
            }
            const encoder = new FileReader();
            encoder.onloadend = () => {
                const { result } = encoder;
                if (typeof result === 'string') {
                    const content = result.split(/,/)[1];
                    resolve(content);
                }
                else {
                    resolve('');
                }
            };
            encoder.readAsDataURL(request.response);
        }
        function timeout() {
            if (placeholder) {
                resolve(placeholder);
            }
            else {
                fail(`timeout of ${TIMEOUT}ms occured while fetching resource: ${url}`);
            }
        }
        function fail(message) {
            throw new Error(message);
        }
    });
}
export function formatDataAsUrl(content, type) {
    return `data:${type};base64,${content}`;
}
export function getEscapedString(string) {
    return string.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
}
export function getEscapedXHTMLString(input) {
    return input.replace(/#/g, '%23').replace(/\n/g, '%0A');
}
export function getWidthForElement(element) {
    const rightBorder = getPixelSizeForStyleProperty(element, 'border-right-width');
    const leftBorder = getPixelSizeForStyleProperty(element, 'border-left-width');
    return element.scrollWidth + rightBorder + leftBorder;
}
export function getHeightForElement(element) {
    const bottomBorder = getPixelSizeForStyleProperty(element, 'border-bottom-width');
    const topBorder = getPixelSizeForStyleProperty(element, 'border-top-width');
    return element.scrollHeight + bottomBorder + topBorder;
}
function getPixelSizeForStyleProperty(element, styleProperty) {
    const value = window.getComputedStyle(element).getPropertyValue(styleProperty);
    return parseFloat(value.replace('px', ''));
}
//# sourceMappingURL=Utils.web.js.map