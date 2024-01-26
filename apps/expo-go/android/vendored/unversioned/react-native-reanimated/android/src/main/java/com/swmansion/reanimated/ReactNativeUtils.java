package com.swmansion.reanimated;

import android.graphics.drawable.Drawable;
import android.view.View;
import com.facebook.react.views.image.ReactImageView;
import com.facebook.react.views.view.ReactViewBackgroundDrawable;
import java.lang.reflect.Field;

public class ReactNativeUtils {

  private static Field mBorderRadiusField;

  public static float getBorderRadius(View view) {
    if (view.getBackground() != null) {
      Drawable background = view.getBackground();
      if (background instanceof ReactViewBackgroundDrawable) {
        return ((ReactViewBackgroundDrawable) background).getFullBorderRadius();
      }
    } else if (view instanceof ReactImageView) {
      try {
        if (mBorderRadiusField == null) {
          mBorderRadiusField = ReactImageView.class.getDeclaredField("mBorderRadius");
          mBorderRadiusField.setAccessible(true);
        }
        float borderRadius = mBorderRadiusField.getFloat(view);
        if (Float.isNaN(borderRadius)) {
          return 0;
        }
        return borderRadius;
      } catch (NullPointerException | NoSuchFieldException | IllegalAccessException ignored) {
        // In case of non-standard view is better to not support the border animation
        // instead of throwing exception
      }
    }
    return 0;
  }
}
