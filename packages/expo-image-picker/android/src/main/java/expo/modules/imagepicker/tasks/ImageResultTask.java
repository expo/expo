package expo.modules.imagepicker.tasks;

import android.content.ContentResolver;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;

import org.unimodules.core.Promise;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.exifinterface.media.ExifInterface;
import expo.modules.imagepicker.ImagePickerConstance;
import expo.modules.imagepicker.ImagePickerFileUtils;
import expo.modules.imagepicker.exporters.ImageExporter;

import static expo.modules.imagepicker.ImagePickerConstance.CACHE_DIR_NAME;
import static expo.modules.imagepicker.ImagePickerConstance.TAG;
import static expo.modules.imagepicker.ImagePickerConstance.exifTags;

public class ImageResultTask extends ImagePickerResultTask {
  private final boolean mExifData;
  @NonNull
  private final String mType;
  @NonNull
  private final ImageExporter mImageExporter;

  public ImageResultTask(@NonNull Promise promise,
                         @NonNull Uri uri,
                         @NonNull ContentResolver contentResolver,
                         @NonNull final File cacheDir,
                         boolean exifData,
                         @NonNull String type,
                         @NonNull ImageExporter imageExporter) {
    super(promise, uri, contentResolver, cacheDir);
    mExifData = exifData;
    mType = type;
    mImageExporter = imageExporter;
  }

  @Override
  protected Void doInBackground(Void... params) {
    try {
      File outputFile = getOutputFile();
      Bundle exif = getExifData();
      mImageExporter.export(mUri, outputFile, new ImageExporter.ImageExporterListener() {
        @Override
        public void onExportResult(@Nullable ByteArrayOutputStream out, int width, int height) {
          Bundle response = new Bundle();
          response.putString("uri", outputFile.toURI().toString());

          if (out != null) {
            response.putString("base64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
          }

          response.putInt("width", width);
          response.putInt("height", height);
          if (exif != null) {
            response.putBundle("exif", exif);
          }
          response.putBoolean("cancelled", false);
          response.putString("type", "image");

          mPromise.resolve(response);
        }

        @Override
        public void onFailure(@Nullable Throwable cause) {
          mPromise.reject(ImagePickerConstance.ERR_CAN_NOT_SAVE_RESULT, ImagePickerConstance.CAN_NOT_SAVE_RESULT_MESSAGE, cause);
        }
      });
    } catch (IOException e) {
      mPromise.reject(ImagePickerConstance.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstance.CAN_NOT_EXTRACT_METADATA_MESSAGE, e);
    }
    return null;
  }

  protected File getOutputFile() throws IOException {
    String extension = deduceExtension();
    return new File(ImagePickerFileUtils.generateOutputPath(mCacheDir, CACHE_DIR_NAME, extension));
  }

  private String deduceExtension() {
    String extension = ".jpg";
    if (mType.contains("png")) {
      extension = ".png";
    } else if (mType.contains("gif")) {
      extension = ".gif";
    } else if (mType.contains("bmp")) {
      extension = ".bmp";
    } else if (!mType.contains("jpeg")) {
      Log.w(TAG, "Image type not supported. Falling back to JPEG instead.");
      extension = ".jpg";
    }
    return extension;
  }

  private Bundle getExifData() throws IOException {
    return mExifData ? readExif() : null;
  }

  private Bundle readExif() throws IOException {
    Bundle exifMap = new Bundle();
    try (InputStream in = Objects.requireNonNull(mContentResolver.openInputStream(mUri))) {
      ExifInterface exifInterface = new ExifInterface(in);
      for (String[] tagInfo : exifTags) {
        String name = tagInfo[1];
        if (exifInterface.getAttribute(name) != null) {
          String type = tagInfo[0];
          switch (type) {
            case "string":
              exifMap.putString(name, exifInterface.getAttribute(name));
              break;
            case "int":
              exifMap.putInt(name, exifInterface.getAttributeInt(name, 0));
              break;
            case "double":
              exifMap.putDouble(name, exifInterface.getAttributeDouble(name, 0));
              break;
          }
        }
      }

      // Explicitly get latitude, longitude, altitude with their specific accessor functions.
      double[] latLong = exifInterface.getLatLong();
      if (latLong != null) {
        exifMap.putDouble(ExifInterface.TAG_GPS_LATITUDE, latLong[0]);
        exifMap.putDouble(ExifInterface.TAG_GPS_LONGITUDE, latLong[1]);
        exifMap.putDouble(ExifInterface.TAG_GPS_ALTITUDE, exifInterface.getAltitude(0));
      }
    }
    return exifMap;
  }
}
