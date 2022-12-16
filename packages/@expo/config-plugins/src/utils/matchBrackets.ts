const LEFT_BRACKETS = ['(', '{'] as const;
const RIGHT_BRACKETS = [')', '}'] as const;

type LeftBracket = typeof LEFT_BRACKETS[number];
type RightBracket = typeof RIGHT_BRACKETS[number];
type Bracket = LeftBracket | RightBracket;

export function findMatchingBracketPosition(
  contents: string,
  bracket: Bracket,
  offset: number = 0
): number {
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

function isLeftBracket(bracket: Bracket): boolean {
  const leftBracketList: readonly Bracket[] = LEFT_BRACKETS;
  return leftBracketList.includes(bracket);
}

function getMatchingBracket(bracket: Bracket): Bracket {
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
