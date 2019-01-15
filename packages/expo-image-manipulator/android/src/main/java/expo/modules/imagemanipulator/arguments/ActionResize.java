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
    Map optionsMap = Utilities.ensureMap(options, TAG);

    Double widthDouble = Utilities.getDoubleFromOptions(optionsMap, KEY_WIDTH, TAG + "." + KEY_WIDTH);
    Integer width = widthDouble != null ? widthDouble.intValue() : 0;
    Double heightDouble = Utilities.getDoubleFromOptions(optionsMap, KEY_HEIGHT, TAG + "." + KEY_HEIGHT);
    Integer height = heightDouble != null ? heightDouble.intValue() : 0;

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
