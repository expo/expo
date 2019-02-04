package expo.modules.imagemanipulator.arguments;

import android.support.annotation.NonNull;

import java.util.Map;

public class ActionResize {
  private static final String TAG = "action.resize";

  private static final String KEY_WIDTH = "width";
  private static final String KEY_HEIGHT = "height";

  @NonNull
  private final Integer mWidth;
  @NonNull
  private final Integer mHeight;

  private ActionResize(@NonNull Integer width, @NonNull Integer height) {
    mWidth = width;
    mHeight = height;
  }

  static ActionResize fromObject(Object options) {
    if (!(options instanceof Map<?, ?>)) {
      throw new IllegalArgumentException("'" + TAG + "' must be an object");
    }
    Map optionsMap = (Map) options;

    int width = 0;
    if (optionsMap.containsKey(KEY_WIDTH)) {
      if (!(optionsMap.get(KEY_WIDTH) instanceof Double)) {
        throw new IllegalArgumentException("'" + TAG + "." + KEY_WIDTH + "' must be a Number value");
      }
      width = ((Double) optionsMap.get(KEY_WIDTH)).intValue();
    }

    int height = 0;
    if (optionsMap.containsKey(KEY_HEIGHT)) {
      if (!(optionsMap.get(KEY_HEIGHT) instanceof Double)) {
        throw new IllegalArgumentException("'" + TAG + "." + KEY_HEIGHT + "' must be a Number value");
      }
      height = ((Double) optionsMap.get(KEY_HEIGHT)).intValue();
    }

    return new ActionResize(width, height);
  }

  @NonNull
  public Integer getWidth() {
    return mWidth;
  }

  @NonNull
  public Integer getHeight() {
    return mHeight;
  }
}
