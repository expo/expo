package expo.modules.imagemanipulator.arguments;

import androidx.annotation.NonNull;

import java.util.Map;

public class ActionCrop {
  private static final String TAG = "action.crop";

  private static final String KEY_ORIGIN_X = "originX";
  private static final String KEY_ORIGIN_Y = "originY";
  private static final String KEY_WIDTH = "width";
  private static final String KEY_HEIGHT = "height";

  @NonNull
  private final Integer mOriginX;
  @NonNull
  private final Integer mOriginY;
  @NonNull
  private final Integer mWidth;
  @NonNull
  private final Integer mHeight;

  private ActionCrop(
      @NonNull Integer originX,
      @NonNull Integer originY,
      @NonNull Integer width,
      @NonNull Integer height) {
    mOriginX = originX;
    mOriginY = originY;
    mWidth = width;
    mHeight = height;
  }

  static ActionCrop fromObject(Object options) throws IllegalArgumentException {
    if (!(options instanceof Map<?,?>)){
      throw new IllegalArgumentException("'" + TAG + "' must be an object");
    }
    Map optionsMap = (Map) options;

    Double originXDouble = ActionCrop.getDoubleFromOptions(optionsMap, KEY_ORIGIN_X, TAG + "." + KEY_ORIGIN_X);
    if (originXDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_ORIGIN_X + "' must be defined");
    }
    Integer originX = originXDouble.intValue();

    Double originYDouble = ActionCrop.getDoubleFromOptions(optionsMap, KEY_ORIGIN_Y, TAG + "." + KEY_ORIGIN_Y);
    if (originYDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_ORIGIN_Y + "' must be defined");
    }
    Integer originY = originYDouble.intValue();

    Double widthDouble = ActionCrop.getDoubleFromOptions(optionsMap, KEY_WIDTH, TAG + "." + KEY_WIDTH);
    if (widthDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_WIDTH + "' must be defined");
    }
    Integer width = widthDouble.intValue();

    Double heightDouble = ActionCrop.getDoubleFromOptions(optionsMap, KEY_HEIGHT, TAG + "." + KEY_HEIGHT);
    if (heightDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_HEIGHT + "' must be defined");
    }
    Integer height = heightDouble.intValue();

    return new ActionCrop(originX, originY, width, height);
  }

  private static Double getDoubleFromOptions(Map options, String key, String pathToErroneousKey) {
    if (!options.containsKey(key)) {
      return null;
    }
    if (!(options.get(key) instanceof Double)) {
      throw new IllegalArgumentException("'" + pathToErroneousKey + "' must be a Number value");
    }
    return ((Double) options.get(key));
  }

  @NonNull
  public Integer getOriginX() {
    return mOriginX;
  }

  @NonNull
  public Integer getOriginY() {
    return mOriginY;
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
