package org.unimodules.interfaces.imageloader;

import android.graphics.Bitmap;

import java.util.concurrent.Future;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public interface ImageLoader {
  interface ResultListener {
    void onSuccess(@NonNull Bitmap bitmap);

    void onFailure(@Nullable Throwable cause);
  }

  /**
   * Loads image into memory that might be cached and downsampled if necessary.
   */
  Future<Bitmap> loadImageForDisplayFromURL(@NonNull String url);

  /**
   * Loads image into memory that might be cached and downsampled if necessary.
   */
  void loadImageForDisplayFromURL(@NonNull String url, ResultListener resultListener);

  /**
   * Loads full-sized image with no caching.
   */
  Future<Bitmap> loadImageForManipulationFromURL(@NonNull String url);

  /**
   * Loads full-sized image with no caching.
   */
  void loadImageForManipulationFromURL(@NonNull String url, ResultListener resultListener);
}
