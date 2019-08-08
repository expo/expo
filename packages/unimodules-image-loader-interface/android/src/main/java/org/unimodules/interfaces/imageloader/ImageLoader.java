package org.unimodules.interfaces.imageloader;

import android.graphics.Bitmap;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

public interface ImageLoader {
  interface ResultListener {
    void onSuccess(@NonNull Bitmap bitmap);
    void onFailure(@Nullable Throwable cause);
  }

  /**
   * Loads image into memory that might be cached and downsampled if necessary.
   */
  void loadImageForDisplayFromURL(@NonNull String url, ResultListener resultListener);

  /**
   * Loads full-sized image with no caching.
   */
  void loadImageForManipulationFromURL(@NonNull String url, ResultListener resultListener);
}
