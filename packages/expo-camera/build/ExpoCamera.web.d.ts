import { type PropsWithChildren } from 'react';
import { CameraNativeProps, CameraCapturedPicture, CameraPictureOptions } from './Camera.types';
export interface ExponentCameraRef {
    getAvailablePictureSizes: (ratio: string) => Promise<string[]>;
    takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
    resumePreview: () => Promise<void>;
    pausePreview: () => Promise<void>;
}
declare const ExponentCamera: ({ facing, poster, ref, ...props }: PropsWithChildren<CameraNativeProps>) => import("react").JSX.Element;
export default ExponentCamera;
//# sourceMappingURL=ExpoCamera.web.d.ts.map