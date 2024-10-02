type LeftBrackets = ['(', '{'];
type RightBrackets = [')', '}'];
type LeftBracket = LeftBrackets[number];
type RightBracket = RightBrackets[number];
type Bracket = LeftBracket | RightBracket;
export declare function findMatchingBracketPosition(contents: string, bracket: Bracket, offset?: number): number;
export {};
