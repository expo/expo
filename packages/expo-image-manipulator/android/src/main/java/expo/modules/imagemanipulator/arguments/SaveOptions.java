package expo.modules.imagemanipulator.arguments;

import android.support.annotation.NonNull;

import java.util.HashMap;
import java.util.Map;

public class SaveOptions extends HashMap<String, Object> {
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

  public static SaveOptions fromMap(Map<String, Object> options) throws IllegalArgumentException {
    Boolean base64Nullable = Utilities.getBooleanFromOptions(options, KEY_BASE64, TAG + "." + KEY_BASE64);
    boolean base64 = base64Nullable != null ? base64Nullable : false;
    Double compressNullable = Utilities.getDoubleFromOptions(options, KEY_COMPRESS, TAG + "." + KEY_COMPRESS);
    Double compress = compressNullable != null ? compressNullable : 1.0;
    SaveOptionsFormat mediaTypes = options.containsKey(KEY_FORMAT) ? SaveOptionsFormat.fromObject(options.get(KEY_FORMAT)) : SaveOptionsFormat.JPEG;

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

