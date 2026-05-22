export declare const EXPO_SHARED_OBJECT_ID_KEY = "__expo_shared_object_id__";
export declare const EXPO_UI_SHARED_OBJECT_BRAND = "__expo_ui_shared_object__";
export type ExpoUISharedObject = {
    [EXPO_SHARED_OBJECT_ID_KEY]: number;
    [EXPO_UI_SHARED_OBJECT_BRAND]: true;
};
export declare function brandExpoUISharedObject<T extends object>(sharedObject: T): T;
export declare function isExpoUISharedObject(value: unknown): value is ExpoUISharedObject;
//# sourceMappingURL=sharedObjectBrand.d.ts.map