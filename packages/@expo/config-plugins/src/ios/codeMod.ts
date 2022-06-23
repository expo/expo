import { CodeBlock, insertContentsAtOffset, searchFromOffset } from '../utils/commonCodeMod';
import { findMatchingBracketPosition } from '../utils/matchBrackets';

interface SwiftFunctionParam {
  argumentLabel: string;
  parameterName: string;
  typeString: string;
}

interface InsertContentFunctionOptions {
  position: 'head' | 'tail' | 'tailBeforeLastReturn';
  indent?: number;
}

/**
 * Add Objective-C import
 * @param source source contents
 * @param imports array of imports, e.g. ['<Foundation/Foundation.h>']
 * @returns updated contents
 */
export function addObjcImports(source: string, imports: string[]): string {
  const lines = source.split('\n');
  // Try to insert statements after first #import where would probably not in #if block
  const lineIndexWithFirstImport = lines.findIndex(line => line.match(/^#import .*$/));
  for (const importElement of imports) {
    if (!source.includes(importElement)) {
      const importStatement = `#import ${importElement}`;
      lines.splice(lineIndexWithFirstImport + 1, 0, importStatement);
    }
  }
  return lines.join('\n');
}

/**
 * Find code block of Objective-C interface or implementation
 *
 * @param contents source contents
 * @param declaration interface/implementation, e.g. '@interface Foo'
 * @returns found CodeBlock, or null if not found
 */
export function findObjcInterfaceCodeBlock(
  contents: string,
  declaration: string
): CodeBlock | null {
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

/**
 * Find code block of Objective-C function without declaration, will return only {} block
 *
 * @param contents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @returns found CodeBlock, or null if not found.
 */
export function findObjcFunctionCodeBlock(contents: string, selector: string): CodeBlock | null {
  const symbols = selector.split(':');
  const argsCount = symbols.length - 1;
  let pattern = '^[\\-+]\\s*\\(.+?\\)';
  if (argsCount === 0) {
    pattern += `${symbols[0]}\\s+`;
  } else {
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

  const end = findMatchingBracketPosition(contents, '{', start);
  return {
    start,
    end,
    code: contents.substring(start, end + 1),
  };
}

/**
 * Insert contents to the Objective-C function block
 *
 * @param srcContents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
export function insertContentsInsideObjcFunctionBlock(
  srcContents: string,
  selector: string,
  insertion: string,
  options: InsertContentFunctionOptions
): string {
  return insertContentsInsideFunctionBlock(srcContents, selector, insertion, options, 'objc');
}

/**
 * Insert contents to the Objective-C interface/implementation block
 *
 * @param srcContents source contents
 * @param declaration interface/implementation, e.g. '@interface Foo'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
export function insertContentsInsideObjcInterfaceBlock(
  srcContents: string,
  declaration: string,
  insertion: string,
  options: {
    position: 'head' | 'tail';
  }
): string {
  const codeBlock = findObjcInterfaceCodeBlock(srcContents, declaration);
  if (!codeBlock) {
    return srcContents;
  }

  const { position } = options;
  if (position === 'head') {
    const firstNewLineIndex = srcContents.indexOf('\n', codeBlock.start);
    srcContents = insertContentsAtOffset(srcContents, insertion, firstNewLineIndex);
  } else if (position === 'tail') {
    const endLen = '@end'.length;
    srcContents = insertContentsAtOffset(srcContents, insertion, codeBlock.end - endLen);
  }
  return srcContents;
}

/**
 * Find code block of Swift function without declaration, will return only {} block
 *
 * @param contents source contents
 * @param selector function selector, e.g. 'doSomething(_:withSomeValue:)'
 * @returns found CodeBlock, or null if not found.
 */
export function findSwiftFunctionCodeBlock(contents: string, selector: string): CodeBlock | null {
  const parenthesesIndex = selector.indexOf('(');
  // `functName` === 'doSomething' of 'doSomething(_:withSomeValue:)'
  const funcName = selector.substring(0, parenthesesIndex);
  // `argLabels` === ['_', 'withSomeValue'] 'doSomething(_:withSomeValue:)'
  const argLabels = selector.substring(parenthesesIndex + 1, selector.length - 2).split(':');

  let searchOffset = 0;
  const funcCandidateRegExp = new RegExp(`\\sfunc\\s+${funcName}\\(`, 'm');
  let funcCandidateOffset = searchFromOffset(contents, funcCandidateRegExp, searchOffset);
  while (funcCandidateOffset >= 0) {
    // Parse function parameters
    const paramsStartOffset = contents.indexOf('(', funcCandidateOffset);
    const paramsEndOffset = findMatchingBracketPosition(contents, '(', paramsStartOffset);
    const paramsString = contents.substring(paramsStartOffset + 1, paramsEndOffset);
    const params = paramsString.split(',').map(parseSwiftFunctionParam);

    // Prepare offset for next round
    searchOffset = paramsEndOffset + 1;
    funcCandidateOffset = searchFromOffset(contents, funcCandidateRegExp, searchOffset);

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
    const codeBlockEnd = findMatchingBracketPosition(contents, '{', paramsEndOffset);
    const codeBlock = contents.substring(codeBlockStart, codeBlockEnd + 1);
    return {
      start: codeBlockStart,
      end: codeBlockEnd,
      code: codeBlock,
    };
  }

  return null;
}

function parseSwiftFunctionParam(paramTuple: string): SwiftFunctionParam {
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
export function insertContentsInsideSwiftClassBlock(
  srcContents: string,
  declaration: string,
  insertion: string,
  options: {
    position: 'head' | 'tail';
  }
): string {
  const start = srcContents.search(new RegExp(`\\s*${declaration}.*?[\\(\\{]`));
  if (start < 0) {
    throw new Error(`Unable to find class code block - declaration[${declaration}]`);
  }

  const { position } = options;
  if (position === 'head') {
    const firstBracketIndex = srcContents.indexOf('{', start);
    srcContents = insertContentsAtOffset(srcContents, insertion, firstBracketIndex + 1);
  } else if (position === 'tail') {
    const endBracketIndex = findMatchingBracketPosition(srcContents, '{', start);
    srcContents = insertContentsAtOffset(srcContents, insertion, endBracketIndex);
  }
  return srcContents;
}

/**
 * Insert contents to the Swift function block
 *
 * @param srcContents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
export function insertContentsInsideSwiftFunctionBlock(
  srcContents: string,
  selector: string,
  insertion: string,
  options: InsertContentFunctionOptions
): string {
  return insertContentsInsideFunctionBlock(srcContents, selector, insertion, options, 'swift');
}

function insertContentsInsideFunctionBlock(
  srcContents: string,
  selector: string,
  insertion: string,
  options: InsertContentFunctionOptions,
  language: 'objc' | 'swift'
): string {
  const codeBlock =
    language === 'objc'
      ? findObjcFunctionCodeBlock(srcContents, selector)
      : findSwiftFunctionCodeBlock(srcContents, selector);
  if (!codeBlock) {
    return srcContents;
  }

  const { position } = options;
  const indent = ' '.repeat(options.indent ?? 2);

  if (position === 'head') {
    srcContents = insertContentsAtOffset(
      srcContents,
      `\n${indent}${insertion}`,
      codeBlock.start + 1
    );
  } else if (position === 'tail') {
    srcContents = insertContentsAtOffset(srcContents, `\n${indent}${insertion}`, codeBlock.end - 1);
  } else if (position === 'tailBeforeLastReturn') {
    let lastReturnIndex = srcContents.lastIndexOf(' return ', codeBlock.end);
    if (lastReturnIndex < 0) {
      throw new Error(`Cannot find last return statement:\n${srcContents}`);
    }
    lastReturnIndex += 1; // +1 for the prefix space
    srcContents = insertContentsAtOffset(srcContents, `${insertion}\n${indent}`, lastReturnIndex);
  }

  return srcContents;
}
