"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml_js_1 = require("xml-js");
const file_helpers_1 = require("../file-helpers");
function isElementType(el) {
    return el.name !== undefined;
}
function isElementsType(el) {
    return !el.name && Boolean(el.elements);
}
function isCommentType(el) {
    return el.comment !== undefined;
}
function isTextType(el) {
    return el.text !== undefined;
}
function isExplicitNewValue(el) {
    // @ts-ignore
    return typeof el === 'object' && el.hasOwnProperty('newValue');
}
function unboxExplicitNewValue(el) {
    return isExplicitNewValue(el) ? el.newValue : el;
}
function compareElements(element, expectedElement) {
    var _a;
    if (isTextType(expectedElement)) {
        return element.type === 'text';
    }
    if (isCommentType(expectedElement)) {
        return element.type === 'comment' && ((_a = element.comment) === null || _a === void 0 ? void 0 : _a.trim()) === expectedElement.comment.trim();
    }
    if (isElementType(expectedElement) && element.type === 'element') {
        if (expectedElement.name !== element.name) {
            return false;
        }
        if (!element.attributes) {
            return true;
        }
        for (const [key, value] of Object.entries(expectedElement.attributes || {})) {
            if (isExplicitNewValue(value)) {
                // this attribute has to be overridden
                continue;
            }
            if (element.attributes[key] !== value) {
                return false;
            }
        }
        return true;
    }
    return false;
}
function sortWithExplicitIndex(elements) {
    if (!elements) {
        return;
    }
    const result = new Array(elements.length);
    const elementsWithExplicitIndices = elements.filter(({ idx }) => idx !== undefined);
    const elementsWithoutExplicitIndices = elements.filter(({ idx }) => idx === undefined);
    elementsWithoutExplicitIndices.forEach((el, idx) => (result[idx] = el));
    elementsWithExplicitIndices.forEach(({ idx, ...el }, i) => {
        // @ts-ignore
        result.splice(idx !== null && idx !== void 0 ? idx : i, 0, el);
    });
    return result;
}
function mergeXmlElementsLists(current, expected) {
    if (isExplicitNewValue(expected) || !current) {
        const sortedExpected = sortWithExplicitIndex(unboxExplicitNewValue(expected));
        return sortedExpected === null || sortedExpected === void 0 ? void 0 : sortedExpected.map(convertToElement);
    }
    if (!expected) {
        return current;
    }
    const result = [];
    for (const currentElement of current) {
        const idxInExpected = expected.findIndex(el => compareElements(currentElement, el));
        if (idxInExpected !== -1) {
            const { idx, ...element } = expected.splice(idxInExpected, 1)[0];
            result.push({ idx, ...mergeXmlElements(currentElement, element) });
        }
        else {
            result.push(currentElement);
        }
    }
    result.push(...expected.map(({ idx, ...el }) => ({ idx, ...convertToElement(el) })));
    const sortedResult = sortWithExplicitIndex(result);
    return sortedResult;
}
function convertToElement(expectedElement) {
    if (isCommentType(expectedElement)) {
        return {
            ...expectedElement,
            type: 'comment',
        };
    }
    if (isTextType(expectedElement)) {
        return {
            ...expectedElement,
            type: 'text',
        };
    }
    if (isElementsType(expectedElement)) {
        return {
            elements: unboxExplicitNewValue(expectedElement.elements).map(convertToElement),
            type: 'element',
        };
    }
    const { elements, attributes, ...expectedRest } = expectedElement;
    const result = {
        ...expectedRest,
        type: 'element',
    };
    if (attributes) {
        result.attributes = convertExpectedAttributes(attributes);
    }
    if (elements) {
        result.elements = unboxExplicitNewValue(elements).map(convertToElement);
    }
    return result;
}
function convertExpectedAttributes(expectedAttributes) {
    if (expectedAttributes) {
        const result = Object.entries(expectedAttributes).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: unboxExplicitNewValue(value),
        }), {});
        return result;
    }
    return undefined;
}
function mergeAndConvertToElement({ attributes: currentAttributes, ...currentRest }, { attributes: expectedAttributes, ...expectedRest }) {
    const result = {
        ...currentRest,
        ...expectedRest,
    };
    const attributes = (currentAttributes || expectedAttributes) && {
        ...currentAttributes,
        ...convertExpectedAttributes(expectedAttributes),
    };
    if (attributes) {
        result.attributes = attributes;
    }
    return result;
}
/**
 * Assumption is that elements are `equal` semantically
 */
function mergeXmlElements(current, expected) {
    if (isCommentType(expected)) {
        return {
            ...current,
            ...expected,
            type: 'comment',
        };
    }
    if (isTextType(expected)) {
        return {
            ...current,
            ...expected,
            type: 'text',
        };
    }
    if (isElementsType(expected)) {
        const result = {
            ...current,
            type: 'element',
        };
        const elements = mergeXmlElementsLists(current.elements, expected.elements);
        if (elements) {
            result.elements = elements;
        }
        return result;
    }
    const { elements: currentElements, ...currentRest } = current;
    const { elements: expectedElements, ...expectedRest } = expected;
    const elements = mergeXmlElementsLists(current.elements, expected.elements);
    const result = {
        ...mergeAndConvertToElement(currentRest, expectedRest),
        type: 'element',
    };
    if (elements) {
        result.elements = elements;
    }
    return result;
}
exports.mergeXmlElements = mergeXmlElements;
async function readXmlFile(filePath, fallbackContent = `<?xml version="1.0" encoding="utf-8"?>`) {
    const fileContent = await file_helpers_1.readFileWithFallback(filePath, fallbackContent);
    const fileXml = xml_js_1.xml2js(fileContent);
    return fileXml;
}
exports.readXmlFile = readXmlFile;
async function writeXmlFile(filePath, xml) {
    const fileXml = xml_js_1.js2xml(xml, { indentAttributes: true, spaces: 2 });
    const correctedFile = fileXml.replace(/(?<openTag><[^\s]+)\n *(?<firstAttribute> [^\s]+=".+?")\n *((?<secondAttribute> [^\s]+=".+?")\n *)?(?<closeTag>[/?]?>)/g, '$1$2$4$5');
    await file_helpers_1.createDirAndWriteFile(filePath, `${correctedFile}\n`);
}
exports.writeXmlFile = writeXmlFile;
//# sourceMappingURL=index.js.map