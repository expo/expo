package expo.interfaces.imageloader;

import android.graphics.Bitmap;

public interface ImageLoader {
  interface ResultListener {
    void onImageLoaded(Bitmap bitmap);

    void onFailure(Throwable cause);
  }

  void loadImageForURL(String url, ResultListener resultListener);
}
