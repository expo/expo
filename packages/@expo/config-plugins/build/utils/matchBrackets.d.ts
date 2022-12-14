declare const LEFT_BRACKETS: readonly ["(", "{"];
declare const RIGHT_BRACKETS: readonly [")", "}"];
type LeftBracket = typeof LEFT_BRACKETS[number];
type RightBracket = typeof RIGHT_BRACKETS[number];
type Bracket = LeftBracket | RightBracket;
export declare function findMatchingBracketPosition(contents: string, bracket: Bracket, offset?: number): number;
export {};
