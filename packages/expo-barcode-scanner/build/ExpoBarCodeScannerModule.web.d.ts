import { PermissionResponse } from 'expo-modules-core';
declare const _default: {
    readonly name: string;
    readonly BarCodeType: {
        code39mod43: string;
        code138: string;
        interleaved2of5: string;
        aztec: string;
        ean13: string;
        ean8: string;
        qr: string;
        pdf417: string;
        upc_e: string;
        datamatrix: string;
        code39: string;
        code93: string;
        itf14: string;
        codabar: string;
        code128: string;
        upc_a: string;
    };
    readonly Type: {
        front: string;
        back: string;
    };
    requestPermissionsAsync(): Promise<PermissionResponse>;
    getPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
//# sourceMappingURL=ExpoBarCodeScannerModule.web.d.ts.map