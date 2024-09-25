"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findMatchingBracketPosition = findMatchingBracketPosition;
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
      } else if (c === matchingBracket) {
        if (stackCounter === 0) {
          return i;
        }
        stackCounter -= 1;
      }
    }
  } else {
    // search backward
    for (let i = firstBracketPos - 1; i >= 0; --i) {
      const c = contents[i];
      if (c === bracket) {
        stackCounter += 1;
      } else if (c === matchingBracket) {
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
//# sourceMappingURL=matchBrackets.js.map