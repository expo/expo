package dev.expo.payments

import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.TextView
import androidx.test.core.app.ActivityScenario.launch
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.EspressoException
import androidx.test.espresso.PerformException
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.espresso.matcher.ViewMatchers.withTagKey
import androidx.test.espresso.matcher.ViewMatchers.withTagValue
import androidx.test.espresso.util.HumanReadables
import androidx.test.espresso.util.TreeIterables
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import org.hamcrest.CoreMatchers.allOf
import org.hamcrest.CoreMatchers.`is`
import org.hamcrest.Matcher
import org.json.JSONArray
import org.json.JSONException
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.io.IOException
import java.util.concurrent.TimeoutException

private const val TEST_RESULT_ID = "test_suite_text_results"
private const val TEST_TIMEOUT_MS = 20000L
private const val TEST_EXPECTED_RESULT = "Success!"

@RunWith(Parameterized::class)
@LargeTest
class BareExpoTestSuite(private val testCaseName: String) {
  companion object {
    @JvmStatic
    @Parameterized.Parameters(name = "{index}: {0}")
    fun testCases() = loadTestCases()

    private fun loadTestCases(): List<String> {
      try {
        val data = InstrumentationRegistry.getInstrumentation().context.assets.open("TestSuite.json").bufferedReader().use { it.readText() }
        val json = JSONArray(data)
        return buildList {
          for (i in 0 until json.length()) {
            add(json.getString(i))
          }
        }
      } catch (ex: Exception) {
        when (ex) {
          is IOException, is JSONException -> {
            println("Invalid TestSuite.json data: ${ex.message}")
            return emptyList()
          }
          else -> throw ex
        }
      }
    }
  }

  @Test
  fun runTest() {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("bareexpo://test-suite/run?tests=$testCaseName"))
    launch<MainActivity>(intent).use {
      onView(isRoot()).perform(waitForTestCompleted(testCaseName, TEST_TIMEOUT_MS))
    }
  }

  private fun waitForTestCompleted(testCaseName: String, timeoutMs: Long): ViewAction {
    return object : ViewAction {
      override fun getDescription(): String {
        return "wait for test completed - testCaseName[$testCaseName]"
      }

      override fun getConstraints(): Matcher<View> {
        return isAssignableFrom(View::class.java)
      }

      override fun perform(uiController: UiController?, view: View?) {
        uiController?.loopMainThreadUntilIdle()
        val startTime = System.currentTimeMillis()
        val endTime: Long = startTime + timeoutMs
        val viewMatcher: Matcher<View> = allOf(
          withTagKey(com.facebook.react.R.id.react_test_id),
          withTagValue(`is`(TEST_RESULT_ID))
        )

        var matchedView: View? = null
        outer@ do {
          for (child in TreeIterables.breadthFirstViewTraversal(view)) {
            // found view with required ID
            if (viewMatcher.matches(child)) {
              matchedView = child
              break@outer
            }
          }
          uiController!!.loopMainThreadForAtLeast(100)
        } while (System.currentTimeMillis() < endTime)

        // view matched
        if (matchedView != null) {
          val text = (matchedView as TextView).text
          if (text.contains(TEST_EXPECTED_RESULT)) {
            return
          } else {
            throw TestFailedException(text.toString())
          }
        }

        // timeout happens
        throw PerformException.Builder()
          .withViewDescription(HumanReadables.describe(view))
          .withActionDescription(this.description)
          .withCause(TimeoutException())
          .build()
      }
    }
  }
}

data class TestFailedException(val testResult: String) : RuntimeException("Test failed: $testResult"), EspressoException
