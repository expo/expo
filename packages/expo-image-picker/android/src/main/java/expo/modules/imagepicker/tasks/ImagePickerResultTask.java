package expo.modules.imagepicker.tasks;

import android.content.ContentResolver;
import android.net.Uri;
import android.os.AsyncTask;

import org.unimodules.core.Promise;

import java.io.File;

import androidx.annotation.NonNull;

public abstract class ImagePickerResultTask extends AsyncTask<Void, Void, Void> {
  protected final Promise mPromise;
  protected final Uri mUri;
  protected ContentResolver mContentResolver;
  protected File mCacheDir;

  public ImagePickerResultTask(@NonNull final Promise promise,
                               @NonNull final Uri uri,
                               @NonNull final ContentResolver contentResolver,
                               @NonNull final File cacheDir) {
    mPromise = promise;
    mUri = uri;
    mContentResolver = contentResolver;
    mCacheDir = cacheDir;
  }

  @Override
  protected abstract Void doInBackground(Void... params);

}
