package expo.interfaces.imageloader;

import android.graphics.Bitmap;

public interface ImageLoader {
  interface ResultListener {
    void onSuccess(Bitmap bitmap);
    void onFailure(Throwable cause);
  }

  void loadImageFromURL(String url, ResultListener resultListener);
}
