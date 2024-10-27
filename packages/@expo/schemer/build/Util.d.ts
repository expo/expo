export declare const fieldPathToSchemaPath: (fieldPath: string) => string;
export declare const schemaPointerToFieldPath: (jsonPointer: string) => string;
export declare const fieldPathToSchema: (schema: object, fieldPath: string) => any;
export declare function pathToSegments(path: string | string[]): string[];
export declare function get(object: any, path: string | string[]): any;
