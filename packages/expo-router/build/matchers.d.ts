/** Match `[page]` -> `page` */
export declare function matchDynamicName(name: string): string | undefined;
/** Match `[...page]` -> `page` */
export declare function matchDeepDynamicRouteName(name: string): string | undefined;
/** Test `/` -> `page` */
export declare function testNotFound(name: string): boolean;
/** Match `(page)` -> `page` */
export declare function matchGroupName(name: string): string | undefined;
export declare function getNameFromFilePath(name: string): string;
export declare function getContextKey(name: string): string;
/** Remove `.js`, `.ts`, `.jsx`, `.tsx` */
export declare function removeSupportedExtensions(name: string): string;
export declare function removeFileSystemDots(filePath: string): string;
export declare function stripGroupSegmentsFromPath(path: string): string;
export declare function stripInvisibleSegmentsFromPath(path: string): string;
//# sourceMappingURL=matchers.d.ts.map