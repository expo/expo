package expo.modules.payments.stripe.util;

import android.text.TextUtils;

public abstract class ArgCheck {

  public static <T> T nonNull(T t) {
    if (t == null) {
      throw new NullPointerException();
    }

    return t;
  }

  public static <T> T nonNull(T t, String message) {
    if (t == null) {
      throw new NullPointerException(message);
    }
    return t;
  }

  public static String notEmptyString(String string) {
    if (TextUtils.isEmpty(string)) {
      throw new IllegalArgumentException();
    }

    return string;
  }

  public static String isDouble(String string) {
    String digital = notEmptyString(string);
    Double.parseDouble(string);
    return digital;
  }

  public static void isTrue(boolean shouldBeTrue) {
    if (!shouldBeTrue) {
      throw new IllegalArgumentException();
    }
  }

  public static void isTrue(boolean shouldBeTrue, String message) {
    if (!shouldBeTrue) {
      throw new IllegalArgumentException(message);
    }
  }
}
