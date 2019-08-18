// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.graphics.Rect;
import android.support.test.espresso.PerformException;
import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.matcher.ViewMatchers;
import android.support.test.espresso.util.HumanReadables;
import android.util.Log;
import android.view.View;
import android.widget.HorizontalScrollView;
import android.widget.ScrollView;

import org.hamcrest.Matcher;

import static android.support.test.espresso.action.ViewActions.actionWithAssertions;
import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static android.support.test.espresso.matcher.ViewMatchers.isDescendantOfA;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayingAtLeast;
import static android.support.test.espresso.matcher.ViewMatchers.withClassName;
import static android.support.test.espresso.matcher.ViewMatchers.withEffectiveVisibility;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.containsString;

public class ExponentScrollToAction implements ViewAction {
  private static final String TAG = ExponentScrollToAction.class.getSimpleName();

  public static ViewAction exponentScrollTo() {
    return actionWithAssertions(new ExponentScrollToAction());
  }

  @SuppressWarnings("unchecked")
  @Override
  public Matcher<View> getConstraints() {
    return allOf(withEffectiveVisibility(ViewMatchers.Visibility.VISIBLE), isDescendantOfA(anyOf(
        isAssignableFrom(ScrollView.class), isAssignableFrom(HorizontalScrollView.class),
        withClassName(containsString("ScrollView")))));
  }

  @Override
  public void perform(UiController uiController, View view) {
    if (isDisplayingAtLeast(90).matches(view)) {
      Log.i(TAG, "View is already displayed. Returning.");
      return;
    }
    Rect rect = new Rect();
    view.getDrawingRect(rect);
    if (!view.requestRectangleOnScreen(rect, true /* immediate */)) {
      Log.w(TAG, "Scrolling to view was requested, but none of the parents scrolled.");
    }
    uiController.loopMainThreadUntilIdle();
    if (!isDisplayingAtLeast(90).matches(view)) {
      throw new PerformException.Builder()
          .withActionDescription(this.getDescription())
          .withViewDescription(HumanReadables.describe(view))
          .withCause(new RuntimeException(
              "Scrolling to view was attempted, but the view is not displayed"))
          .build();
    }
  }

  @Override
  public String getDescription() {
    return "scroll to";
  }
}
