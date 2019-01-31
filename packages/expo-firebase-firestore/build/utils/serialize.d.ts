import { NativeTypeMap } from '../firestoreTypes.types';
export declare const buildNativeMap: (data: Object) => {
    [key: string]: NativeTypeMap;
};
export declare const buildNativeArray: (array: {
    [key: string]: any;
}[]) => NativeTypeMap[];
export declare const buildTypeMap: (value: any) => NativeTypeMap | null;
export declare const parseNativeMap: (firestore: object, nativeData: {
    [key: string]: NativeTypeMap;
}) => void | Object;
