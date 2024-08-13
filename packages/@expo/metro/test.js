/* eslint-env node */

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourceFile = ts.createSourceFile(
  'metro.d.ts',
  fs.readFileSync(path.join(__dirname, './types/metro.d.ts')).toString(),
  ts.ScriptTarget.ES2015,
  true
);

ts.forEachChild(sourceFile, visit);

/** @param {import('typescript').Node} node */
function visit(node) {
  if (ts.isModuleDeclaration(node)) {
    console.log(
      'declaration:', 
      node.name.text, 
      '<-', 
      getModuleDeclarationLeadingComment(node).text
    );
  }
}

function getModuleDeclarationLeadingComment(node) {
  // The comment node can be found from the parent node of a module declaration
  const range = getLeadingComment(node.parent);
  const text = getNodeText(node.parent, range);
  return range && text ? { ...range, text } : null;
}

function getLeadingComment(node) {
  const ranges = ts.getLeadingCommentRanges(node.getFullText(), node.getFullStart());
  if (!ranges?.length) {
    return null;
  }

  // We limit comments to single lines before declarations,
  // only return the closest comment to the declaration
  return ranges[ranges.length - 1];
}

function getNodeText(node, range) {
  if (!node || !range) return null;
  return node.getFullText().substring(range.pos, range.end);
}
