"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertContentsInsideSwiftFunctionBlock = exports.insertContentsInsideSwiftClassBlock = exports.findSwiftFunctionCodeBlock = exports.insertContentsInsideObjcInterfaceBlock = exports.insertContentsInsideObjcFunctionBlock = exports.findObjcFunctionCodeBlock = exports.findObjcInterfaceCodeBlock = exports.addObjcImports = void 0;
const commonCodeMod_1 = require("../utils/commonCodeMod");
const matchBrackets_1 = require("../utils/matchBrackets");
/**
 * Add Objective-C import
 * @param source source contents
 * @param imports array of imports, e.g. ['<Foundation/Foundation.h>']
 * @returns updated contents
 */
function addObjcImports(source, imports) {
    const lines = source.split('\n');
    // Try to insert statements after first #import where would probably not in #if block
    const lineIndexWithFirstImport = lines.findIndex((line) => line.match(/^#import .*$/));
    for (const importElement of imports) {
        if (!source.includes(importElement)) {
            const importStatement = `#import ${importElement}`;
            lines.splice(lineIndexWithFirstImport + 1, 0, importStatement);
        }
    }
    return lines.join('\n');
}
exports.addObjcImports = addObjcImports;
/**
 * Find code block of Objective-C interface or implementation
 *
 * @param contents source contents
 * @param declaration interface/implementation, e.g. '@interface Foo'
 * @returns found CodeBlock, or null if not found
 */
function findObjcInterfaceCodeBlock(contents, declaration) {
    const start = contents.search(new RegExp(`^${declaration}\\W`, 'm'));
    if (start < 0) {
        return null;
    }
    let end = contents.indexOf('\n@end', start);
    end += 5; // '\n@end'.length === 5
    return {
        start,
        end,
        code: contents.substring(start, end),
    };
}
exports.findObjcInterfaceCodeBlock = findObjcInterfaceCodeBlock;
/**
 * Find code block of Objective-C function without declaration, will return only {} block
 *
 * @param contents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @returns found CodeBlock, or null if not found.
 */
function findObjcFunctionCodeBlock(contents, selector) {
    const symbols = selector.split(':');
    const argsCount = symbols.length - 1;
    let pattern = '^[\\-+]\\s*\\(.+?\\)';
    if (argsCount === 0) {
        pattern += `${symbols[0]}\\s+`;
    }
    else {
        for (let i = 0; i < argsCount; ++i) {
            const argSymbol = `${symbols[i]}:\\(.+\\)\\w+`;
            pattern += `${argSymbol}\\s+`;
        }
    }
    pattern += '{';
    let start = contents.search(new RegExp(pattern, 'm'));
    if (start < 0) {
        return null;
    }
    start = contents.indexOf('{', start);
    const end = (0, matchBrackets_1.findMatchingBracketPosition)(contents, '{', start);
    return {
        start,
        end,
        code: contents.substring(start, end + 1),
    };
}
exports.findObjcFunctionCodeBlock = findObjcFunctionCodeBlock;
/**
 * Insert contents to the Objective-C function block
 *
 * @param srcContents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
function insertContentsInsideObjcFunctionBlock(srcContents, selector, insertion, options) {
    return insertContentsInsideFunctionBlock(srcContents, selector, insertion, options, 'objc');
}
exports.insertContentsInsideObjcFunctionBlock = insertContentsInsideObjcFunctionBlock;
/**
 * Insert contents to the Objective-C interface/implementation block
 *
 * @param srcContents source contents
 * @param declaration interface/implementation, e.g. '@interface Foo'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
function insertContentsInsideObjcInterfaceBlock(srcContents, declaration, insertion, options) {
    const codeBlock = findObjcInterfaceCodeBlock(srcContents, declaration);
    if (!codeBlock) {
        return srcContents;
    }
    const { position } = options;
    if (position === 'head') {
        const firstNewLineIndex = srcContents.indexOf('\n', codeBlock.start);
        srcContents = (0, commonCodeMod_1.insertContentsAtOffset)(srcContents, insertion, firstNewLineIndex);
    }
    else if (position === 'tail') {
        const endLen = '@end'.length;
        srcContents = (0, commonCodeMod_1.insertContentsAtOffset)(srcContents, insertion, codeBlock.end - endLen);
    }
    return srcContents;
}
exports.insertContentsInsideObjcInterfaceBlock = insertContentsInsideObjcInterfaceBlock;
/**
 * Find code block of Swift function without declaration, will return only {} block
 *
 * @param contents source contents
 * @param selector function selector, e.g. 'doSomething(_:withSomeValue:)'
 * @returns found CodeBlock, or null if not found.
 */
function findSwiftFunctionCodeBlock(contents, selector) {
    const parenthesesIndex = selector.indexOf('(');
    // `functName` === 'doSomething' of 'doSomething(_:withSomeValue:)'
    const funcName = selector.substring(0, parenthesesIndex);
    // `argLabels` === ['_', 'withSomeValue'] 'doSomething(_:withSomeValue:)'
    const argLabels = selector.substring(parenthesesIndex + 1, selector.length - 2).split(':');
    let searchOffset = 0;
    const funcCandidateRegExp = new RegExp(`\\sfunc\\s+${funcName}\\(`, 'm');
    let funcCandidateOffset = (0, commonCodeMod_1.searchFromOffset)(contents, funcCandidateRegExp, searchOffset);
    while (funcCandidateOffset >= 0) {
        // Parse function parameters
        const paramsStartOffset = contents.indexOf('(', funcCandidateOffset);
        const paramsEndOffset = (0, matchBrackets_1.findMatchingBracketPosition)(contents, '(', paramsStartOffset);
        const paramsString = contents.substring(paramsStartOffset + 1, paramsEndOffset);
        const params = paramsString.split(',').map(parseSwiftFunctionParam);
        // Prepare offset for next round
        searchOffset = paramsEndOffset + 1;
        funcCandidateOffset = (0, commonCodeMod_1.searchFromOffset)(contents, funcCandidateRegExp, searchOffset);
        // Try to match function parameters
        if (argLabels.length !== params.length) {
            continue;
        }
        for (let i = 0; i < argLabels.length; ++i) {
            if (argLabels[i] !== params[i].argumentLabel) {
                continue;
            }
        }
        // This function is matched one, get the code block.
        const codeBlockStart = contents.indexOf('{', paramsEndOffset);
        const codeBlockEnd = (0, matchBrackets_1.findMatchingBracketPosition)(contents, '{', paramsEndOffset);
        const codeBlock = contents.substring(codeBlockStart, codeBlockEnd + 1);
        return {
            start: codeBlockStart,
            end: codeBlockEnd,
            code: codeBlock,
        };
    }
    return null;
}
exports.findSwiftFunctionCodeBlock = findSwiftFunctionCodeBlock;
function parseSwiftFunctionParam(paramTuple) {
    const semiIndex = paramTuple.indexOf(':');
    const [argumentLabel, parameterName] = paramTuple.substring(0, semiIndex).split(/\s+/);
    const typeString = paramTuple.substring(semiIndex + 1).trim();
    return {
        argumentLabel,
        parameterName,
        typeString,
    };
}
/**
 * Insert contents to the swift class block
 *
 * @param srcContents source contents
 * @param declaration class/extension declaration, e.g. 'class AppDelegate'
 * @param insertion code to append
 * @param options insertion options
 * @returns updated contents
 */
function insertContentsInsideSwiftClassBlock(srcContents, declaration, insertion, options) {
    const start = srcContents.search(new RegExp(`\\s*${declaration}.*?[\\(\\{]`));
    if (start < 0) {
        throw new Error(`Unable to find class code block - declaration[${declaration}]`);
    }
    const { position } = options;
    if (position === 'head') {
        const firstBracketIndex = srcContents.indexOf('{', start);
        srcContents = (0, commonCodeMod_1.insertContentsAtOffset)(srcContents, insertion, firstBracketIndex + 1);
    }
    else if (position === 'tail') {
        const endBracketIndex = (0, matchBrackets_1.findMatchingBracketPosition)(srcContents, '{', start);
        srcContents = (0, commonCodeMod_1.insertContentsAtOffset)(srcContents, insertion, endBracketIndex);
    }
    return srcContents;
}
exports.insertContentsInsideSwiftClassBlock = insertContentsInsideSwiftClassBlock;
/**
 * Insert contents to the Swift function block
 *
 * @param srcContents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
function insertContentsInsideSwiftFunctionBlock(srcContents, selector, insertion, options) {
    return insertContentsInsideFunctionBlock(srcContents, selector, insertion, options, 'swift');
}
exports.insertContentsInsideSwiftFunctionBlock = insertContentsInsideSwiftFunctionBlock;
function insertContentsInsideFunctionBlock(srcContents, selector, insertion, options, language) {
    const codeBlock = language === 'objc'
        ? findObjcFunctionCodeBlock(srcContents, selector)
        : findSwiftFunctionCodeBlock(srcContents, selector);
    if (!codeBlock) {
        return srcContents;
    }
    const { position } = options;
    const indent = ' '.repeat(options.indent ?? 2);
    if (position === 'head') {
        srcContents = (0, commonCodeMod_1.insertContentsAtOffset)(srcContents, `\n${indent}${insertion}`, codeBlock.start + 1);
    }
    else if (position === 'tail') {
        srcContents = (0, commonCodeMod_1.insertContentsAtOffset)(srcContents, `\n${indent}${insertion}`, codeBlock.end - 1);
    }
    else if (position === 'tailBeforeLastReturn') {
        let lastReturnIndex = srcContents.lastIndexOf(' return ', codeBlock.end);
        if (lastReturnIndex < 0) {
            throw new Error(`Cannot find last return statement:\n${srcContents}`);
        }
        lastReturnIndex += 1; // +1 for the prefix space
        srcContents = (0, commonCodeMod_1.insertContentsAtOffset)(srcContents, `${insertion}\n${indent}`, lastReturnIndex);
    }
    return srcContents;
}
