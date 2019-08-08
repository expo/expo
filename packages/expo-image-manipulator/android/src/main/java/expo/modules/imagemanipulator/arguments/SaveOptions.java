package expo.modules.imagemanipulator.arguments;

import android.support.annotation.NonNull;

import org.unimodules.core.arguments.ReadableArguments;

public class SaveOptions {
  private static final String TAG = "saveOptions";

  private static final String KEY_BASE64 = "base64";
  private static final String KEY_COMPRESS = "compress";
  private static final String KEY_FORMAT = "format";

  @NonNull
  private final Boolean mBase64;
  @NonNull
  private final Double mCompress;
  @NonNull
  private final SaveOptionsFormat mFormat;

  public static SaveOptions fromArguments(ReadableArguments options) throws IllegalArgumentException {
    boolean base64 = false;
    if (options.containsKey(KEY_BASE64)) {
      if (!(options.get(KEY_BASE64) instanceof Boolean)) {
        throw new IllegalArgumentException("'" + TAG + "." + KEY_BASE64 + "' must be a Boolean value");
      }
      base64 = options.getBoolean(KEY_BASE64);
    }

    double compress = 1.0;
    if (options.containsKey(KEY_COMPRESS)) {
      if (!(options.get(KEY_COMPRESS) instanceof Double)) {
        throw new IllegalArgumentException("'" + TAG + "." + KEY_COMPRESS + "' must be a Number value");
      }
      compress = options.getDouble(KEY_COMPRESS);
    }

    SaveOptionsFormat mediaTypes = SaveOptionsFormat.fromObject(options.get(KEY_FORMAT));

    return new SaveOptions(base64, compress, mediaTypes);
  }

  private SaveOptions(
      boolean base64,
      @NonNull Double compress,
      @NonNull SaveOptionsFormat format
  ) {
    mBase64 = base64;
    mCompress = compress;
    mFormat = format;
  }

  @NonNull
  public Boolean hasBase64() {
    return mBase64;
  }

  @NonNull
  public Double getCompress() {
    return mCompress;
  }

  @NonNull
  public SaveOptionsFormat getFormat() {
    return mFormat;
  }
}

