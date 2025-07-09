export declare function addImports(source: string, imports: string[], isJava: boolean): string;
export declare function appendContentsInsideDeclarationBlock(srcContents: string, declaration: string, insertion: string): string;
type LeftBrackets = ['(', '{'];
type RightBrackets = [')', '}'];
type LeftBracket = LeftBrackets[number];
type RightBracket = RightBrackets[number];
type Bracket = LeftBracket | RightBracket;
export declare function findMatchingBracketPosition(contents: string, bracket: Bracket, offset?: number): number;
export {};
