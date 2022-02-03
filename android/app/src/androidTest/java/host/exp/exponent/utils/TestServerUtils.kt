package host.exp.exponent.utils

import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.test.InstrumentationRegistry
import androidx.test.espresso.Espresso
import androidx.test.espresso.assertion.ViewAssertions
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import host.exp.exponent.generated.ExponentBuildConstants
import host.exp.exponent.kernel.ExponentUrls
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.util.*

object TestServerUtils {
  private const val LAUNCH_TIMEOUT = 5000

  private val JSON = MediaType.parse("application/json; charset=utf-8")
  private val isTestServerAvailable: Boolean
    get() = ExponentBuildConstants.TEST_SERVER_URL != "TODO"

  @Throws(Exception::class)
  fun runFixtureTest(device: UiDevice, fixtureName: String) {
    if (!isTestServerAvailable) {
      return
    }

    // Get a fixture server
    val fixtureServer = getFixtureServerInstance(fixtureName)

    // Launch the app
    val context = InstrumentationRegistry.getContext()
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(fixtureServer!!.manifestServerUrl)).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)

    // Wait for the app to appear
    device.wait(Until.hasObject(By.pkg("host.exp.exponent").depth(0)), LAUNCH_TIMEOUT.toLong())

    // Need this to wait on idling resources
    Espresso.onView(ExponentMatchers.withTestId("test_container"))
      .check(ViewAssertions.matches(ViewMatchers.isDisplayed()))
    for (event in fixtureServer.testEvents) {
      event.waitForCompleted(device, fixtureServer.manifestServerUrl)
    }
  }

  @Throws(IOException::class)
  private fun httpRequest(request: Request): String {
    val client = OkHttpClient()
    val response = client.newCall(request).execute()
    if (!response.isSuccessful) {
      throw IOException("Unexpected code $response")
    }
    return response.body()!!.string()
  }

  private fun getFixtureServerInstance(fixtureName: String): FixtureServerInstance? {
    try {
      val request = Request.Builder()
        .url(ExponentBuildConstants.TEST_SERVER_URL + "/start-fixture-server?fixtureName=" + fixtureName)
        .build()
      val responseJson = JSONObject(httpRequest(request))
      val manifestServerUrl = responseJson.getString("manifestServerUrl")
      val jsonTestEvents = responseJson.getJSONArray("testEvents")
      val testEvents: MutableList<TestEvent> = ArrayList()
      for (i in 0 until jsonTestEvents.length()) {
        val jsonTestEvent = jsonTestEvents.getJSONObject(i)
        testEvents.add(
          TestEvent(
            jsonTestEvent.getString("type"),
            jsonTestEvent.getString("data"),
            jsonTestEvent.getInt("testEventId")
          )
        )
      }
      return FixtureServerInstance(manifestServerUrl, testEvents)
    } catch (e: IOException) {
      e.printStackTrace()
    } catch (e: JSONException) {
      e.printStackTrace()
    }
    return null
  }

  @Throws(Exception::class)
  fun reportTestResult(success: Boolean, testName: String?, logs: String?) {
    if (!isTestServerAvailable) {
      return
    }
    val jsonBody = JSONObject().apply {
      put("testRunId", ExponentBuildConstants.TEST_RUN_ID)
      put("testName", testName)
      put("success", success)
      put("logs", logs)
      put("deviceName", Build.MODEL)
      put("systemVersion", Build.VERSION.RELEASE)
    }
    val request = Request.Builder()
      .url(ExponentBuildConstants.TEST_SERVER_URL + "/report-test-result")
      .post(RequestBody.create(JSON, jsonBody.toString()))
      .build()
    httpRequest(request)
  }

  class TestEvent(private val type: String, private val data: String, private val testEventId: Int) {
    @Throws(Exception::class)
    fun waitForCompleted(device: UiDevice, manifestUrl: String) {
      if (type == "findTextOnScreen") {
        ExpoConditionWatcher.waitForText(device, data)
      }
      try {
        val request = Request.Builder()
          .url(ExponentUrls.toHttp(manifestUrl) + "/finished-test-event")
          .addHeader("test-event-id", testEventId.toString())
          .build()
        httpRequest(request)
      } catch (e: RuntimeException) {
      } catch (e: IOException) {
      }
    }
  }

  class FixtureServerInstance(val manifestServerUrl: String, val testEvents: List<TestEvent>)
}
