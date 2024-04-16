import * as React from 'react';
import { CameraReadyListener, CameraType, MountErrorListener } from '../legacy/Camera.types';
export declare function useWebCameraStream(video: React.MutableRefObject<HTMLVideoElement | null>, preferredType: CameraType, settings: Record<string, any>, { onCameraReady, onMountError, }: {
    onCameraReady?: CameraReadyListener;
    onMountError?: MountErrorListener;
}): {
    type: CameraType | null;
    mediaTrackSettings: MediaTrackSettings | null;
};
//# sourceMappingURL=useWebCameraStream.d.ts.map