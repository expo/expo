/**
 * Add cocoapods-mangle to the Podfile.
 * This adds a post_install script so that all ObjC symbols in pod dependencies
 * are prefixed, allowing multiple brownfield frameworks to coexist in
 * the same host app without duplicate symbol errors.
 */
export declare const addManglePlugin: (podfile: string, targetName: string) => string;
export declare const addNewPodsTarget: (podfile: string, targetName: string) => string;
export declare const addPrebuiltSettings: (podfile: string) => string;
