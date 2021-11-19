// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.view.View
import androidx.test.espresso.matcher.BoundedMatcher
import org.hamcrest.Description
import org.hamcrest.Matcher
import org.hamcrest.Matchers

object ExponentMatchers {
  fun getTestId(view: View): String? {
    return if (view.tag is String) view.tag as String else null
  }

  fun withTestId(text: String): Matcher<View> {
    return withTestId(Matchers.`is`(text))
  }

  private fun withTestId(stringMatcher: Matcher<String>): Matcher<View> {
    return object : BoundedMatcher<View, View>(View::class.java) {
      override fun describeTo(description: Description) {
        description.appendText("with test id: ")
        stringMatcher.describeTo(description)
      }

      public override fun matchesSafely(view: View): Boolean {
        val testId = getTestId(view)
        return if (testId == null) {
          false
        } else {
          stringMatcher.matches(testId)
        }
      }
    }
  }
}
