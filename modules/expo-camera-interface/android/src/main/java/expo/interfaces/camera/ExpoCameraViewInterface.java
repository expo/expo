package expo.interfaces.camera;

import android.graphics.SurfaceTexture;

public interface ExpoCameraViewInterface {

  void setPreviewTexture(SurfaceTexture surfaceTexture);

  int[] getPreviewSizeAsArray();
}
