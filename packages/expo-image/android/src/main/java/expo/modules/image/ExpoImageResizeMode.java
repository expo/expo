package expo.modules.image;

import android.widget.ImageView.ScaleType;

public enum ExpoImageResizeMode {
    UNKNOWN("unknown", null),
    CONTAIN("contain", ScaleType.FIT_CENTER),
    COVER("cover", ScaleType.CENTER_CROP),
    STRETCH("stretch", ScaleType.FIT_XY),
    CENTER("center", ScaleType.CENTER),
    REPEAT("repeat", ScaleType.FIT_XY);
  
    private final String mStringValue;
    private final ScaleType mScaleType;
  
    ExpoImageResizeMode(String stringValue, ScaleType scaleType) {
      mStringValue = stringValue;
      mScaleType = scaleType;
    }
  
    public String getStringValue() {
      return mStringValue;
    }
  
    public ScaleType getScaleType() {
      return mScaleType;
    }
  
    public static ExpoImageResizeMode fromStringValue(String value) {
      for (ExpoImageResizeMode resizeMode : ExpoImageResizeMode.values()) {
        if (resizeMode.getStringValue().equals(value)) {
          return resizeMode;
        }
      }
      return ExpoImageResizeMode.UNKNOWN;
    }
  }