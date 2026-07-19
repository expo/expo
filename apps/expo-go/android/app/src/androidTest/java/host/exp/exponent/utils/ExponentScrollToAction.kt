// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.graphics.Rect
import android.util.Log
import android.view.View
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import android.widget.ScrollView
import android.widget.HorizontalScrollView
import androidx.test.espresso.PerformException
import androidx.test.espresso.UiController
import androidx.test.espresso.util.HumanReadables
import androidx.test.espresso.action.ViewActions
import org.hamcrest.Matcher
import org.hamcrest.Matchers
import java.lang.RuntimeException

class ExponentScrollToAction : ViewAction {
  override fun getConstraints(): Matcher<View> {
    return Matchers.allOf(
      ViewMatchers.withEffectiveVisibility(ViewMatchers.Visibility.VISIBLE),
      ViewMatchers.isDescendantOfA(
        Matchers.anyOf(
          ViewMatchers.isAssignableFrom(ScrollView::class.java),
          ViewMatchers.isAssignableFrom(
            HorizontalScrollView::class.java
          ),
          ViewMatchers.withClassName(Matchers.containsString("ScrollView"))
        )
      )
    )
  }

  override fun perform(uiController: UiController, view: View) {
    if (ViewMatchers.isDisplayingAtLeast(90).matches(view)) {
      Log.i(TAG, "View is already displayed. Returning.")
      return
    }
    val rect = Rect()
    view.getDrawingRect(rect)
    if (!view.requestRectangleOnScreen(rect, true /* immediate */)) {
      Log.w(TAG, "Scrolling to view was requested, but none of the parents scrolled.")
    }
    uiController.loopMainThreadUntilIdle()
    if (!ViewMatchers.isDisplayingAtLeast(90).matches(view)) {
      throw PerformException.Builder()
        .withActionDescription(this.description)
        .withViewDescription(HumanReadables.describe(view))
        .withCause(
          RuntimeException(
            "Scrolling to view was attempted, but the view is not displayed"
          )
        )
        .build()
    }
  }

  override fun getDescription(): String {
    return "scroll to"
  }

  companion object {
    private val TAG = ExponentScrollToAction::class.java.simpleName
    fun exponentScrollTo(): ViewAction {
      return ViewActions.actionWithAssertions(ExponentScrollToAction())
    }
  }
}
