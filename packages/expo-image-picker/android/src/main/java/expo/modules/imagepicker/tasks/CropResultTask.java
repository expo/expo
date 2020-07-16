package expo.modules.imagepicker.tasks;

import android.content.ContentResolver;
import android.net.Uri;

import org.unimodules.core.Promise;

import java.io.File;

import androidx.annotation.NonNull;
import expo.modules.imagepicker.exporters.CropImageExporter;

public class CropResultTask extends ImageResultTask {
  @NonNull
  private final Uri croppedUri;


  public CropResultTask(@NonNull Promise promise,
                        @NonNull Uri uri,
                        @NonNull ContentResolver contentResolver,
                        @NonNull final File cacheDir,
                        boolean exifData,
                        @NonNull CropImageExporter imageExporter) {
    super(promise, uri, contentResolver, cacheDir, exifData, "", imageExporter);
    croppedUri = uri;
  }

  @Override
  protected File getOutputFile() {
    return new File(croppedUri.getPath());
  }
}
