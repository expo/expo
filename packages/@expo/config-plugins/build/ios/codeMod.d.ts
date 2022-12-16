import { CodeBlock } from '../utils/commonCodeMod';
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
export declare function addObjcImports(source: string, imports: string[]): string;
/**
 * Find code block of Objective-C interface or implementation
 *
 * @param contents source contents
 * @param declaration interface/implementation, e.g. '@interface Foo'
 * @returns found CodeBlock, or null if not found
 */
export declare function findObjcInterfaceCodeBlock(contents: string, declaration: string): CodeBlock | null;
/**
 * Find code block of Objective-C function without declaration, will return only {} block
 *
 * @param contents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @returns found CodeBlock, or null if not found.
 */
export declare function findObjcFunctionCodeBlock(contents: string, selector: string): CodeBlock | null;
/**
 * Insert contents to the Objective-C function block
 *
 * @param srcContents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
export declare function insertContentsInsideObjcFunctionBlock(srcContents: string, selector: string, insertion: string, options: InsertContentFunctionOptions): string;
/**
 * Insert contents to the Objective-C interface/implementation block
 *
 * @param srcContents source contents
 * @param declaration interface/implementation, e.g. '@interface Foo'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
export declare function insertContentsInsideObjcInterfaceBlock(srcContents: string, declaration: string, insertion: string, options: {
    position: 'head' | 'tail';
}): string;
/**
 * Find code block of Swift function without declaration, will return only {} block
 *
 * @param contents source contents
 * @param selector function selector, e.g. 'doSomething(_:withSomeValue:)'
 * @returns found CodeBlock, or null if not found.
 */
export declare function findSwiftFunctionCodeBlock(contents: string, selector: string): CodeBlock | null;
/**
 * Insert contents to the swift class block
 *
 * @param srcContents source contents
 * @param declaration class/extension declaration, e.g. 'class AppDelegate'
 * @param insertion code to append
 * @param options insertion options
 * @returns updated contents
 */
export declare function insertContentsInsideSwiftClassBlock(srcContents: string, declaration: string, insertion: string, options: {
    position: 'head' | 'tail';
}): string;
/**
 * Insert contents to the Swift function block
 *
 * @param srcContents source contents
 * @param selector function selector, e.g. 'doSomething:withSomeValue:'
 * @param insertion code to insert
 * @param options insertion options
 * @returns updated contents
 */
export declare function insertContentsInsideSwiftFunctionBlock(srcContents: string, selector: string, insertion: string, options: InsertContentFunctionOptions): string;
export {};
