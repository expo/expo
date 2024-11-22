import { type PropsWithChildren } from 'react';
import { CameraNativeProps, CameraCapturedPicture, CameraPictureOptions } from './Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: import("react").ForwardRefExoticComponent<Omit<PropsWithChildren<CameraNativeProps>, "ref"> & import("react").RefAttributes<ExponentCameraRef>>;
export default ExponentCamera;
//# sourceMappingURL=ExpoCamera.web.d.ts.map