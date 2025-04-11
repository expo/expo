import { CameraNativeProps, CameraType, FlashMode, CameraViewProps } from '../Camera.types';
export declare const ConversionTables: {
    type: Record<keyof CameraType, CameraNativeProps['facing']>;
    flash: Record<keyof FlashMode, CameraNativeProps['flashMode']>;
    [prop: string]: unknown;
};
export declare function convertNativeProps(props?: CameraViewProps): CameraNativeProps;
export declare function ensureNativeProps(props?: CameraViewProps): CameraNativeProps;
//# sourceMappingURL=props.d.ts.map