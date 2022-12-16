"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addImports = addImports;
exports.appendContentsInsideDeclarationBlock = appendContentsInsideDeclarationBlock;
exports.findNewInstanceCodeBlock = findNewInstanceCodeBlock;
function _commonCodeMod() {
  const data = require("../utils/commonCodeMod");
  _commonCodeMod = function () {
    return data;
  };
  return data;
}
function _matchBrackets() {
  const data = require("../utils/matchBrackets");
  _matchBrackets = function () {
    return data;
  };
  return data;
}
/**
 * Find java or kotlin new class instance code block
 *
 * @param contents source contents
 * @param classDeclaration class declaration or just a class name
 * @param language 'java' | 'kt'
 * @returns `CodeBlock` for start/end offset and code block contents
 */
function findNewInstanceCodeBlock(contents, classDeclaration, language) {
  const isJava = language === 'java';
  let start = isJava ? contents.indexOf(` new ${classDeclaration}(`) : contents.search(new RegExp(` (object\\s*:\\s*)?${classDeclaration}\\(`));
  if (start < 0) {
    return null;
  }
  // `+ 1` for the prefix space
  start += 1;
  let end = (0, _matchBrackets().findMatchingBracketPosition)(contents, '(', start);

  // For anonymous class, should search further to the {} block.
  // ```java
  // new Foo() {
  //   @Override
  //   protected void interfaceMethod {}
  // };
  // ```
  //
  // ```kotlin
  // object : Foo() {
  //   override fun interfaceMethod {}
  // }
  // ```
  const nextBrace = contents.indexOf('{', end + 1);
  const isAnonymousClass = nextBrace >= end && !!contents.substring(end + 1, nextBrace).match(/^\s*$/);
  if (isAnonymousClass) {
    end = (0, _matchBrackets().findMatchingBracketPosition)(contents, '{', end);
  }
  return {
    start,
    end,
    code: contents.substring(start, end + 1)
  };
}

/**
 * Append contents to the end of code declaration block, support class or method declarations.
 *
 * @param srcContents source contents
 * @param declaration class declaration or method declaration
 * @param insertion code to append
 * @returns updated contents
 */
function appendContentsInsideDeclarationBlock(srcContents, declaration, insertion) {
  const start = srcContents.search(new RegExp(`\\s*${declaration}.*?[\\(\\{]`));
  if (start < 0) {
    throw new Error(`Unable to find code block - declaration[${declaration}]`);
  }
  const end = (0, _matchBrackets().findMatchingBracketPosition)(srcContents, '{', start);
  return (0, _commonCodeMod().insertContentsAtOffset)(srcContents, insertion, end);
}
function addImports(source, imports, isJava) {
  const lines = source.split('\n');
  const lineIndexWithPackageDeclaration = lines.findIndex(line => line.match(/^package .*;?$/));
  for (const javaImport of imports) {
    if (!source.includes(javaImport)) {
      const importStatement = `import ${javaImport}${isJava ? ';' : ''}`;
      lines.splice(lineIndexWithPackageDeclaration + 1, 0, importStatement);
    }
  }
  return lines.join('\n');
}
//# sourceMappingURL=codeMod.js.map