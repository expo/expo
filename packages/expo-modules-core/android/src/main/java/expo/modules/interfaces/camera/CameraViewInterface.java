package expo.modules.interfaces.camera;

import android.graphics.SurfaceTexture;

public interface CameraViewInterface {
  void setPreviewTexture(SurfaceTexture surfaceTexture);
  int[] getPreviewSizeAsArray();
}
