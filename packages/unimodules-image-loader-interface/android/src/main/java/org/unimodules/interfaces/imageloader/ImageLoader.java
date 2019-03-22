package org.unimodules.interfaces.imageloader;

import android.graphics.Bitmap;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public interface ImageLoader {
  interface ResultListener {
    void onSuccess(@NonNull Bitmap bitmap);
    void onFailure(@Nullable Throwable cause);
  }

  void loadImageFromURL(@NonNull String url, ResultListener resultListener);
}
