import { CameraNativeProps, CameraType, FlashMode, CameraProps } from '../Camera.types';
export declare const ConversionTables: {
    type: Record<keyof CameraType, CameraNativeProps['facing']>;
    flash: Record<keyof FlashMode, CameraNativeProps['flashMode']>;
};
export declare function convertNativeProps(props?: CameraProps): CameraNativeProps;
export declare function ensureNativeProps(props?: CameraProps): CameraNativeProps;
//# sourceMappingURL=props.d.ts.map