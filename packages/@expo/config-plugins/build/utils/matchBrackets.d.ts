declare const LEFT_BRACKETS: readonly ["(", "{"];
declare const RIGHT_BRACKETS: readonly [")", "}"];
declare type LeftBracket = typeof LEFT_BRACKETS[number];
declare type RightBracket = typeof RIGHT_BRACKETS[number];
declare type Bracket = LeftBracket | RightBracket;
export declare function findMatchingBracketPosition(contents: string, bracket: Bracket, offset?: number): number;
export {};
