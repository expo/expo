package expo.modules.image.enums;

import android.widget.ImageView.ScaleType;

public enum ImageResizeMode {
  UNKNOWN("unknown", null),
  CONTAIN("contain", ScaleType.FIT_CENTER),
  COVER("cover", ScaleType.CENTER_CROP),
  STRETCH("stretch", ScaleType.FIT_XY),
  CENTER("center", ScaleType.CENTER),
  REPEAT("repeat", ScaleType.FIT_XY);

  private final String mStringValue;
  private final ScaleType mScaleType;

  ImageResizeMode(String stringValue, ScaleType scaleType) {
    mStringValue = stringValue;
    mScaleType = scaleType;
  }

  public static ImageResizeMode fromStringValue(String value) {
    for (ImageResizeMode resizeMode : ImageResizeMode.values()) {
      if (resizeMode.getStringValue().equals(value)) {
        return resizeMode;
      }
    }
    return ImageResizeMode.UNKNOWN;
  }

  public String getStringValue() {
    return mStringValue;
  }

  public ScaleType getScaleType() {
    return mScaleType;
  }
}
