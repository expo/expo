package abi31_0_0.expo.interfaces.camera;

import android.graphics.SurfaceTexture;

public interface ExpoCameraViewInterface {

  void setPreviewTexture(SurfaceTexture surfaceTexture);

  int[] getPreviewSizeAsArray();
}
