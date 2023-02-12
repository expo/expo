package abi48_0_0.expo.modules.interfaces.camera;

import android.graphics.SurfaceTexture;

public interface CameraViewInterface {
  void setPreviewTexture(SurfaceTexture surfaceTexture);
  int[] getPreviewSizeAsArray();
}
