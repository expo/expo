"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addImports = addImports;
exports.appendContentsInsideDeclarationBlock = appendContentsInsideDeclarationBlock;
exports.findMatchingBracketPosition = findMatchingBracketPosition;
function addImports(source, imports, isJava) {
    const lines = source.split('\n');
    const lineIndexWithPackageDeclaration = lines.findIndex((line) => line.match(/^package .*;?$/));
    for (const javaImport of imports) {
        if (!source.includes(javaImport)) {
            const importStatement = `import ${javaImport}${isJava ? ';' : ''}`;
            lines.splice(lineIndexWithPackageDeclaration + 2, 0, importStatement);
        }
    }
    return lines.join('\n');
}
function appendContentsInsideDeclarationBlock(srcContents, declaration, insertion) {
    const start = srcContents.search(new RegExp(`\\s*${declaration}.*?[\\(\\{]`));
    if (start < 0) {
        throw new Error(`Unable to find code block - declaration[${declaration}]`);
    }
    const end = findMatchingBracketPosition(srcContents, '{', start);
    return insertContentsAtOffset(srcContents, insertion, end);
}
function insertContentsAtOffset(srcContents, insertion, offset) {
    const srcContentsLength = srcContents.length;
    if (offset < 0 || offset > srcContentsLength) {
        throw new Error('Invalid parameters.');
    }
    if (offset === 0) {
        return `${insertion}${srcContents}`;
    }
    else if (offset === srcContentsLength) {
        return `${srcContents}${insertion}`;
    }
    const prefix = srcContents.substring(0, offset);
    const suffix = srcContents.substring(offset);
    return `${prefix}${insertion}${suffix}`;
}
function findMatchingBracketPosition(contents, bracket, offset = 0) {
    // search first occurrence of `bracket`
    const firstBracketPos = contents.indexOf(bracket, offset);
    if (firstBracketPos < 0) {
        return -1;
    }
    let stackCounter = 0;
    const matchingBracket = getMatchingBracket(bracket);
    if (isLeftBracket(bracket)) {
        const contentsLength = contents.length;
        // search forward
        for (let i = firstBracketPos + 1; i < contentsLength; ++i) {
            const c = contents[i];
            if (c === bracket) {
                stackCounter += 1;
            }
            else if (c === matchingBracket) {
                if (stackCounter === 0) {
                    return i;
                }
                stackCounter -= 1;
            }
        }
    }
    else {
        // search backward
        for (let i = firstBracketPos - 1; i >= 0; --i) {
            const c = contents[i];
            if (c === bracket) {
                stackCounter += 1;
            }
            else if (c === matchingBracket) {
                if (stackCounter === 0) {
                    return i;
                }
                stackCounter -= 1;
            }
        }
    }
    return -1;
}
function isLeftBracket(bracket) {
    const leftBracketList = ['(', '{'];
    return leftBracketList.includes(bracket);
}
function getMatchingBracket(bracket) {
    switch (bracket) {
        case '(':
            return ')';
        case ')':
            return '(';
        case '{':
            return '}';
        case '}':
            return '{';
        default:
            throw new Error(`Unsupported bracket - ${bracket}`);
    }
}
