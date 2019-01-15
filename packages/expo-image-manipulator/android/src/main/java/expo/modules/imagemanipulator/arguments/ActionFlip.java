package expo.modules.imagemanipulator.arguments;

import android.support.annotation.NonNull;

import java.util.Map;

public class ActionFlip {
  private static final String TAG = "action.flip";

  private static final String KEY_VERTICAL = "vertical";
  private static final String KEY_HORIZONTAL = "horizontal";

  @NonNull
  private final Boolean mVertical;
  @NonNull
  private final Boolean mHorizontal;

  private ActionFlip(@NonNull Boolean vertical, @NonNull Boolean horizontal) {
    mVertical = vertical;
    mHorizontal = horizontal;
  }

  static ActionFlip fromObject(Object options) throws IllegalArgumentException {
    Map optionsMap = Utilities.ensureMap(options, TAG);

    Boolean verticalNullable = Utilities.getBooleanFromOptions(optionsMap, KEY_VERTICAL, TAG + "." + KEY_VERTICAL);
    Boolean horizontalNullable = Utilities.getBooleanFromOptions(optionsMap, KEY_HORIZONTAL, TAG + "." + KEY_HORIZONTAL);
    Boolean vertical = verticalNullable != null ? verticalNullable : false;
    Boolean horizontal = horizontalNullable != null ? horizontalNullable : false;

    return new ActionFlip(vertical, horizontal);
  }

  @NonNull
  public Boolean isVertical() {
    return mVertical;
  }

  @NonNull
  public Boolean isHorizontal() {
    return mHorizontal;
  }
}
