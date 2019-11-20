import uuidv4 from 'uuid/v4';
import { batchResolveAllFontsAsync } from './Fonts.web';
import { processAllImagesAsync } from './Images.web';
import * as util from './Utils.web';
async function generateSVGAsync(element, { width, height, bgcolor, style } = {}) {
    const clone = await cloneElement(element);
    if (clone === undefined) {
        throw new Error('Cannot clone null element');
    }
    await Promise.all([batchResolveAllFontsAsync(clone), processAllImagesAsync(clone)]);
    if (bgcolor) {
        clone.style.backgroundColor = bgcolor;
    }
    if (width) {
        clone.style.width = `${width}px`;
    }
    if (height) {
        clone.style.height = `${height}px`;
    }
    if (style) {
        Object.assign(clone.style, style);
    }
    const svgDataUri = await makeSVGDataURIAsync(clone, width || util.getWidthForElement(element), height || util.getHeightForElement(element));
    return svgDataUri;
}
export async function createSVGAsync(element, options = {}) {
    return await generateSVGAsync(element, options);
}
export async function createPixelDataAsync(element, options) {
    const canvas = await draw(element, options);
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Canvas context is not supported.');
    }
    return context.getImageData(0, 0, util.getWidthForElement(element), util.getHeightForElement(element)).data;
}
export async function createPNGAsync(element, options) {
    const canvas = await draw(element, options);
    return await canvas.toDataURL('image/png');
}
export async function createJPEGAsync(element, { quality, ...options }) {
    const canvas = await draw(element, options);
    return await canvas.toDataURL('image/jpeg', quality);
}
export async function createBlobAsync(element, { quality, ...options }) {
    const canvas = await draw(element, options);
    return await util.getBlobFromCanvasAsync(canvas, quality);
}
async function draw(element, options) {
    const fromSVG = await generateSVGAsync(element, options);
    const image = await util.getImageElementFromURIAsync(fromSVG);
    const canvas = newCanvas(element, options);
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Canvas context is not supported.');
    }
    context.drawImage(image, 0, 0);
    return canvas;
}
function newCanvas(element, options) {
    const canvas = document.createElement('canvas');
    canvas.width = options.width || util.getWidthForElement(element);
    canvas.height = options.height || util.getHeightForElement(element);
    if (options.bgcolor) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = options.bgcolor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    return canvas;
}
async function getDeepCopyForElement(element) {
    if (element instanceof HTMLCanvasElement) {
        const dataURL = element.toDataURL();
        return util.getImageElementFromURIAsync(dataURL);
    }
    return element.cloneNode(false);
}
async function cloneElement(element) {
    const clonedNode = await getDeepCopyForElement(element);
    const clone = await cloneChildren(element, clonedNode);
    return await processClone(element, clone);
}
async function cloneChildren({ childNodes }, clone) {
    const children = Array.from(childNodes);
    if (children.length === 0) {
        return clone;
    }
    for (const child of children) {
        const childClone = await cloneElement(child);
        if (childClone) {
            clone.appendChild(childClone);
        }
    }
    return clone;
}
async function processClone(original, clone) {
    if (!(clone instanceof HTMLElement)) {
        // TODO: Bacon: Avoid or throw error
        return clone;
    }
    const source = window.getComputedStyle(original);
    const target = clone.style;
    if (source.cssText) {
        target.cssText = source.cssText;
    }
    else {
        for (const prop in source) {
            const name = source[prop];
            target.setProperty(name, source.getPropertyValue(name), source.getPropertyPriority(name));
        }
    }
    clonePseudoElement(':before', original, clone);
    clonePseudoElement(':after', original, clone);
    mutateInputElement(original, clone);
    mutateSVGElementClone(clone);
    return clone;
}
function clonePseudoElement(element, original, clone) {
    const style = window.getComputedStyle(original, element);
    const content = style.getPropertyValue('content');
    if (content === '' || content === 'none') {
        return;
    }
    const className = uuidv4();
    clone.className = `${clone.className} ${className}`;
    const styleElement = document.createElement('style');
    styleElement.appendChild(formatPseudoElementStyle(className, element, style));
    clone.appendChild(styleElement);
}
function formatPseudoElementStyle(className, element, style) {
    const selector = `.${className}:${element}`;
    const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style);
    return document.createTextNode(`${selector}{${cssText}}`);
}
function formatCSSText(style) {
    const content = style.getPropertyValue('content');
    return `${style.cssText} content: ${content};`;
}
function formatCSSProperties(style) {
    const parsed = Array.from(style)
        .map(name => formatProperty(name, style))
        .join('; ');
    return `${parsed};`;
}
function formatProperty(name, style) {
    return `${name}: ${style.getPropertyValue(name)}${style.getPropertyPriority(name) ? ' !important' : ''}`;
}
function mutateInputElement(element, clone) {
    if (element instanceof HTMLTextAreaElement) {
        clone.innerHTML = element.value;
    }
    if (element instanceof HTMLInputElement) {
        clone.setAttribute('value', element.value);
    }
}
function mutateSVGElementClone(element) {
    if (!(element instanceof SVGElement)) {
        return;
    }
    element.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (element instanceof SVGRectElement) {
        for (const attribute of ['width', 'height']) {
            const value = element.getAttribute(attribute);
            if (!value) {
                continue;
            }
            element.style.setProperty(attribute, value);
        }
    }
}
async function makeSVGDataURIAsync(element, width, height) {
    element.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const serializedNode = new XMLSerializer().serializeToString(element);
    const xhtml = util.getEscapedXHTMLString(serializedNode);
    const foreignObject = `<foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${foreignObject}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${svg}`;
}
//# sourceMappingURL=Creator.web.js.map