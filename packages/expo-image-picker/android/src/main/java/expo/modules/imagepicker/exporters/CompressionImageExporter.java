package expo.modules.imagepicker.exporters;

import android.graphics.Bitmap;
import android.net.Uri;

import org.apache.commons.io.FilenameUtils;
import org.jetbrains.annotations.NotNull;
import org.unimodules.interfaces.imageloader.ImageLoader;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class CompressionImageExporter implements ImageExporter {
  private ImageLoader mImageLoader;
  private int mQuality;
  private boolean mBase64;

  public CompressionImageExporter(@NonNull final ImageLoader imageLoader, int quality, boolean base64) {
    mImageLoader = imageLoader;
    mQuality = quality;
    mBase64 = base64;
  }

  @Override
  public void export(@NotNull Uri source, @NotNull File output, @NotNull ImageExporterListener exporterListener) {
    mImageLoader.loadImageForManipulationFromURL(source.toString(), new ImageLoader.ResultListener() {

      @Override
      public void onSuccess(@NonNull Bitmap bitmap) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        ByteArrayOutputStream out = mBase64 ? new ByteArrayOutputStream() : null;

        try {
          Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;
          if (FilenameUtils.getExtension(output.getPath()).contains("png")) {
            compressFormat = Bitmap.CompressFormat.PNG;
          }

          saveBitmap(bitmap, compressFormat, output, out);
          exporterListener.onExportResult(out, width, height);
        } catch (IOException e) {
          exporterListener.onFailure(e);
        }

        if (out != null) {
          try {
            out.close();
          } catch (IOException e) {
            // We have already resolve promise.
            e.printStackTrace();
          }
        }
      }

      @Override
      public void onFailure(@Nullable Throwable cause) {
        exporterListener.onFailure(cause);
      }
    });
  }

  /**
   * Compress and save the {@code bitmap} to {@code file}, optionally saving it in {@code out} if
   * base64 is requested.
   *
   * @param bitmap         bitmap to be saved
   * @param compressFormat compression format to save the image in
   * @param output         file to save the image to
   * @param out            if not null, the stream to save the image to
   */
  private void saveBitmap(Bitmap bitmap, Bitmap.CompressFormat compressFormat, File output,
                          ByteArrayOutputStream out) throws IOException {
    writeImage(bitmap, output, compressFormat);

    if (mBase64) {
      bitmap.compress(Bitmap.CompressFormat.JPEG, mQuality, out);
    }
  }

  private void writeImage(Bitmap image, File output, Bitmap.CompressFormat compressFormat) throws IOException {
    try (FileOutputStream out = new FileOutputStream(output)) {
      image.compress(compressFormat, mQuality, out);
    }
  }

}
