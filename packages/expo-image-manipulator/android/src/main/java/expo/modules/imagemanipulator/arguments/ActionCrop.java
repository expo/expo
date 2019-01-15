package expo.modules.imagemanipulator.arguments;

import android.support.annotation.NonNull;

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
    Map optionsMap = Utilities.ensureMap(options, TAG);

    Double originXDouble = Utilities.getDoubleFromOptions(optionsMap, KEY_ORIGIN_X, TAG + "." + KEY_ORIGIN_X);
    if (originXDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_ORIGIN_X + "' must be defined");
    }
    Integer originX = originXDouble.intValue();

    Double originYDouble = Utilities.getDoubleFromOptions(optionsMap, KEY_ORIGIN_Y, TAG + "." + KEY_ORIGIN_Y);
    if (originYDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_ORIGIN_Y + "' must be defined");
    }
    Integer originY = originYDouble.intValue();

    Double widthDouble = Utilities.getDoubleFromOptions(optionsMap, KEY_WIDTH, TAG + "." + KEY_WIDTH);
    if (widthDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_WIDTH + "' must be defined");
    }
    Integer width = widthDouble.intValue();

    Double heightDouble = Utilities.getDoubleFromOptions(optionsMap, KEY_HEIGHT, TAG + "." + KEY_HEIGHT);
    if (heightDouble == null) {
      throw new IllegalArgumentException("'" + TAG + "." + KEY_HEIGHT + "' must be defined");
    }
    Integer height = heightDouble.intValue();

    return new ActionCrop(originX, originY, width, height);
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
