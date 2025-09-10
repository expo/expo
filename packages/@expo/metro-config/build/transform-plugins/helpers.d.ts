import type { types, template } from '@babel/core';
export declare const defaultWrapHelper: ({ statement }: typeof template, name: string) => types.Statement;
export declare const strictNamespaceWrapHelper: ({ statement }: typeof template, name: string) => types.Statement;
export declare const namespaceWrapHelper: ({ statement }: typeof template, name: string) => types.Statement;
export declare const liveExportAllHelper: ({ statement }: typeof template, id: string) => types.Statement;
export declare const liveExportHelper: (t: typeof types, exportName: string, expr: types.Expression) => types.Statement;
export declare const assignExportHelper: (t: typeof types, exportName: string, expr: types.Expression) => types.Statement;
export declare const varDeclaratorHelper: (t: typeof types, name: string, expr: types.Expression) => types.Statement;
/** `var %id% = require("%source%");` */
export declare const requireCall: (t: typeof types, id: string, source: types.StringLiteral) => types.VariableDeclaration;
/** `require("%source%");` */
export declare const sideEffectRequireCall: (t: typeof types, source: types.StringLiteral) => types.Statement;
/** `var %id% = %fnName%(%source%);` */
export declare const varDeclaratorCallHelper: (t: typeof types, id: string, fn: string, arg: string) => types.Statement;
export declare const esModuleExportTemplate: ({ statement }: typeof template) => types.Statement;
export declare const nullBoundExpression: (t: typeof types, expr: types.Expression) => types.ParenthesizedExpression;
declare function withLocation<TNode extends types.Node>(node: TNode, loc: types.SourceLocation | null | undefined): TNode;
declare function withLocation<TNode extends types.Node>(nodeArray: readonly TNode[], loc: types.SourceLocation | null | undefined): TNode[];
export { withLocation };
