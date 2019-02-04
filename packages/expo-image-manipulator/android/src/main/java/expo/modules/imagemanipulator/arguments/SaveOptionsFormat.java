package expo.modules.imagemanipulator.arguments;

import android.graphics.Bitmap;

public enum SaveOptionsFormat {
  JPEG("jpeg", Bitmap.CompressFormat.JPEG, ".jpg"),
  PNG("png", Bitmap.CompressFormat.PNG, ".png");

  private final String mFormat;
  private final Bitmap.CompressFormat mCompressFormat;
  private final String mFileExtension;

  SaveOptionsFormat(String format, Bitmap.CompressFormat compressFormat, String fileExtension) {
    mFormat = format;
    mCompressFormat = compressFormat;
    mFileExtension = fileExtension;
  }

  static public SaveOptionsFormat fromObject(Object o) throws IllegalArgumentException {
    String errorMessage = "SaveOption 'format' must be one of ['png', 'jpeg']. Obtained '" + o.toString() + "'";
    if (!(o instanceof String)) {
      throw new IllegalArgumentException(errorMessage);
    }
    for (SaveOptionsFormat f : values()) {
      if (f.mFormat.equals(o)) {
        return f;
      }
    }
    throw new IllegalArgumentException(errorMessage);
  }

  public Bitmap.CompressFormat getCompressFormat() {
    return mCompressFormat;
  }

  public String getFileExtension() {
    return mFileExtension;
  }
}
