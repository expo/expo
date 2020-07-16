package expo.modules.imagepicker.exporters;

import android.content.Context;
import android.graphics.BitmapFactory;
import android.net.Uri;

import org.apache.commons.io.IOUtils;
import org.jetbrains.annotations.NotNull;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import androidx.annotation.NonNull;

public class RawImageExporter implements ImageExporter {
  @NonNull
  private Context mContext;
  private boolean mBase64;

  public RawImageExporter(@NonNull final Context context, boolean base64) {
    mContext = context;
    mBase64 = base64;
  }

  @Override
  public void export(@NotNull Uri source, @NotNull File outPutFile, @NonNull ImageExporterListener exporterListener) {
    ByteArrayOutputStream out = mBase64 ? new ByteArrayOutputStream() : null;
    try {
      copyImage(source, outPutFile, out);

      BitmapFactory.Options options = new BitmapFactory.Options();
      options.inJustDecodeBounds = true;
      BitmapFactory.decodeFile(outPutFile.getAbsolutePath(), options);

      exporterListener.onExportResult(out, options.outWidth, options.outHeight);
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

  /**
   * Copy the image file from {@code originalUri} to {@code file}, optionally saving it in
   * {@code out} if base64 is requested.
   *
   * @param originalUri uri to the file to copy the data from
   * @param file        file to save the image to
   * @param out         if not null, the stream to save the image to
   */
  private void copyImage(Uri originalUri, File file, ByteArrayOutputStream out)
    throws IOException {
    try (InputStream is = Objects.requireNonNull(
      mContext.getApplicationContext().getContentResolver().openInputStream(originalUri))) {

      if (out != null) {
        IOUtils.copy(is, out);
      }

      if (originalUri.compareTo(Uri.fromFile(file)) != 0) { // do not copy file over the same file
        try (FileOutputStream fos = new FileOutputStream(file)) {
          if (out != null) {
            fos.write(out.toByteArray());
          } else {
            IOUtils.copy(is, fos);
          }
        }
      }
    }
  }
}
