export type ExpoFormDataValue = string | Blob;
export type ExpoFormDataPart = {
    string: string;
    headers: {
        [name: string]: string;
    };
} | {
    blob: Blob;
    headers: {
        [name: string]: string;
    };
    name?: string | undefined;
    type?: string | undefined;
} | {
    uri: string;
    headers: {
        [name: string]: string;
    };
    name?: string | undefined;
    type?: string | undefined;
};
export declare class ExpoFormData {
    constructor();
    append(name: string, value: {
        uri: string;
        name?: string;
        type?: string;
    }): void;
    append(name: string, value: string): void;
    append(name: string, value: Blob, filename?: string): void;
    delete(name: string): void;
    get(name: string): FormDataEntryValue | null;
    getAll(name: string): FormDataEntryValue[];
    has(name: string): boolean;
    set(name: string, value: {
        uri: string;
        name?: string;
        type?: string;
    }): void;
    set(name: string, value: string): void;
    set(name: string, value: Blob, filename?: string): void;
    forEach(callback: (value: FormDataEntryValue, key: string, iterable: FormData) => void, thisArg?: unknown): void;
    keys(): IterableIterator<string>;
    values(): IterableIterator<FormDataEntryValue>;
    entries(): IterableIterator<[string, FormDataEntryValue]>;
    [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
}
export declare function installFormDataPatch(formData: typeof FormData): typeof ExpoFormData;
//# sourceMappingURL=FormData.d.ts.map