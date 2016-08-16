// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.support.test.espresso.matcher.BoundedMatcher;
import android.view.View;

import org.hamcrest.Description;
import org.hamcrest.Matcher;

import static org.hamcrest.Matchers.is;

public class ExponentMatchers {

  public static String getTestId(View view) {
    return view.getTag() instanceof String ? (String) view.getTag() : null;
  }

  public static Matcher<View> withTestId(String text) {
    return withTestId(is(text));
  }

  public static Matcher<View> withTestId(final Matcher<String> stringMatcher) {
    return new BoundedMatcher<View, View>(View.class) {
      @Override
      public void describeTo(Description description) {
        description.appendText("with test id: ");
        stringMatcher.describeTo(description);
      }

      @Override
      public boolean matchesSafely(View view) {
        String testId = getTestId(view);
        if (testId == null) {
          return false;
        } else {
          return stringMatcher.matches(testId);
        }
      }
    };
  }
}
