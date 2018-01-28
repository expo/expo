/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.android.cameraview;

import android.media.CamcorderProfile;
import android.view.View;
import android.graphics.SurfaceTexture;

import java.util.Set;

abstract class CameraViewImpl {

    protected final Callback mCallback;

    protected final PreviewImpl mPreview;

    CameraViewImpl(Callback callback, PreviewImpl preview) {
        mCallback = callback;
        mPreview = preview;
    }

    View getView() {
        return mPreview.getView();
    }

    /**
     * @return {@code true} if the implementation was able to start the camera session.
     */
    abstract boolean start();

    abstract void stop();

    abstract boolean isCameraOpened();

    abstract void setFacing(int facing);

    abstract int getFacing();

    abstract Set<AspectRatio> getSupportedAspectRatios();

    /**
     * @return {@code true} if the aspect ratio was changed.
     */
    abstract boolean setAspectRatio(AspectRatio ratio);

    abstract AspectRatio getAspectRatio();

    abstract void setAutoFocus(boolean autoFocus);

    abstract boolean getAutoFocus();

    abstract void setFlash(int flash);

    abstract int getFlash();

    abstract void takePicture();

    abstract boolean record(String path, int maxDuration, int maxFileSize,
                            boolean recordAudio, CamcorderProfile profile);

    abstract void stopRecording();

    abstract void setDisplayOrientation(int displayOrientation);

    abstract void setFocusDepth(float value);

    abstract float getFocusDepth();

    abstract void setZoom(float zoom);

    abstract float getZoom();

    abstract void setWhiteBalance(int whiteBalance);

    abstract int getWhiteBalance();

    abstract void setScanning(boolean isScanning);

    abstract boolean getScanning();

    abstract public void setPreviewTexture(SurfaceTexture surfaceTexture);

    abstract public Size getPreviewSize();

    interface Callback {

        void onCameraOpened();

        void onCameraClosed();

        void onPictureTaken(byte[] data);

        void onVideoRecorded(String path);

        void onFramePreview(byte[] data, int width, int height, int orientation);

        void onMountError();
    }

}
