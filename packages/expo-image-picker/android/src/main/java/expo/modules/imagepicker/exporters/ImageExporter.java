package expo.modules.imagepicker.exporters;

import android.net.Uri;

import java.io.ByteArrayOutputStream;
import java.io.File;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

@FunctionalInterface
public interface ImageExporter {
  void export(@NonNull final Uri source, @NonNull final File output, @NonNull ImageExporterListener exporterListener);

  interface ImageExporterListener {
    void onExportResult(@Nullable ByteArrayOutputStream out, int width, int height);

    void onFailure(@Nullable Throwable cause);
  }
}
