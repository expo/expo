/**
 * Append contents to the end of code declaration block, support class or method declarations.
 *
 * @param srcContents source contents
 * @param declaration class declaration or method declaration
 * @param insertion code to append
 * @returns updated contents
 */
export declare function appendContentsInsideDeclarationBlock(srcContents: string, declaration: string, insertion: string): string;
type LeftBrackets = ['(', '{'];
type RightBrackets = [')', '}'];
type LeftBracket = LeftBrackets[number];
type RightBracket = RightBrackets[number];
type Bracket = LeftBracket | RightBracket;
export declare function findMatchingBracketPosition(contents: string, bracket: Bracket, offset?: number): number;
export {};
