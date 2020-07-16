package expo.modules.imagepicker.exporters;

import android.graphics.Rect;
import android.net.Uri;

import org.apache.commons.io.IOUtils;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import androidx.annotation.NonNull;

public class CropImageExporter implements ImageExporter {
  private final int mRotation;
  @NonNull
  private final Rect mCropRect;
  private boolean mBase64;

  public CropImageExporter(int rotation, @NonNull Rect cropRect, boolean base64) {
    mRotation = rotation;
    mCropRect = cropRect;
    mBase64 = base64;
  }

  // Note: Crop activity saves the result to the output file. So, we don't need to do it.
  @Override
  public void export(@NonNull Uri source, @NonNull File output, @NonNull ImageExporterListener exporterListener) {
    int width, height;
    int rot = mRotation % 360;
    if (rot < 0) {
      rot += 360;
    }
    if (rot == 0 || rot == 180) { // Rotation is right-angled only
      width = mCropRect.width();
      height = mCropRect.height();
    } else {
      width = mCropRect.height();
      height = mCropRect.width();
    }
    if (mBase64) {
      ByteArrayOutputStream out = new ByteArrayOutputStream();

      try (InputStream in = new FileInputStream(Objects.requireNonNull(source.getPath(), "Cannot get path from uri."))) {
        // `CropImage` nullifies the `result.getBitmap()` after it writes out to a file, so
        // we have to read back.
        IOUtils.copy(in, out);
        exporterListener.onExportResult(out, width, height);
      } catch (NullPointerException | IOException e) {
        exporterListener.onFailure(e);
      }

      try {
        out.close();
      } catch (IOException e) {
        // We have already resolve promise.
        e.printStackTrace();
      }

      return;
    }

    exporterListener.onExportResult(null, width, height);
  }
}
