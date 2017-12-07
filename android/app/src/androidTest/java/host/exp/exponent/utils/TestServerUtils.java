package host.exp.exponent.utils;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.support.test.InstrumentationRegistry;
import android.support.test.uiautomator.By;
import android.support.test.uiautomator.UiDevice;
import android.support.test.uiautomator.Until;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import expolib_v1.okhttp3.MediaType;
import expolib_v1.okhttp3.OkHttpClient;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.RequestBody;
import expolib_v1.okhttp3.Response;
import host.exp.exponent.generated.ExponentBuildConstants;
import host.exp.exponent.kernel.ExponentUrls;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static host.exp.exponent.utils.ExponentMatchers.withTestId;

public class TestServerUtils {

  private static final int LAUNCH_TIMEOUT = 5000;
  private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

  public static boolean isTestServerAvailable() {
    return !ExponentBuildConstants.TEST_SERVER_URL.equals("TODO");
  }

  public static void runFixtureTest(final UiDevice device, final String fixtureName) throws Exception {
    if (!isTestServerAvailable()) {
      return;
    }

    // Get a fixture server
    TestServerUtils.FixtureServerInstance fixtureServer = TestServerUtils.getFixtureServerInstance(fixtureName);

    // Launch the app
    Context context = InstrumentationRegistry.getContext();
    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(fixtureServer.manifestServerUrl));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    context.startActivity(intent);

    // Wait for the app to appear
    device.wait(Until.hasObject(By.pkg("host.exp.exponent").depth(0)), LAUNCH_TIMEOUT);

    // Need this to wait on idling resources
    onView(withTestId("test_container")).check(matches(isDisplayed()));

    for (TestServerUtils.TestEvent event : fixtureServer.testEvents) {
      event.waitForCompleted(device, fixtureServer.manifestServerUrl);
    }
  }

  public static class TestEvent {
    public final String type;
    public final String data;
    public final int testEventId;

    public TestEvent(final String type, final String data, final int testEventId) {
      this.type = type;
      this.data = data;
      this.testEventId = testEventId;
    }

    public void waitForCompleted(UiDevice device, String manifestUrl) throws Exception {
      if (type.equals("findTextOnScreen")) {
        ExpoConditionWatcher.waitForText(device, data);
      }

      try {
        Request request = new Request.Builder()
            .url(ExponentUrls.toHttp(manifestUrl) + "/finished-test-event")
            .addHeader("test-event-id", Integer.toString(testEventId))
            .build();
        httpRequest(request);
      } catch (RuntimeException | IOException e) {}
    }
  }

  public static class FixtureServerInstance {
    public final String manifestServerUrl;
    public final List<TestEvent> testEvents;

    public FixtureServerInstance(final String manifestServerUrl, final List<TestEvent> testEvents) {
      this.manifestServerUrl = manifestServerUrl;
      this.testEvents = testEvents;
    }
  }

  private static String httpRequest(final Request request) throws IOException {
    final OkHttpClient client = new OkHttpClient();

    Response response = client.newCall(request).execute();
    if (!response.isSuccessful()) {
      throw new IOException("Unexpected code " + response);
    }
    return response.body().string();
  }

  public static FixtureServerInstance getFixtureServerInstance(final String fixtureName) {
    try {
      Request request = new Request.Builder()
          .url(ExponentBuildConstants.TEST_SERVER_URL + "/start-fixture-server?fixtureName=" + fixtureName)
          .build();
      JSONObject responseJson = new JSONObject(httpRequest(request));
      final String manifestServerUrl = responseJson.getString("manifestServerUrl");
      final JSONArray jsonTestEvents = responseJson.getJSONArray("testEvents");
      final List<TestEvent> testEvents = new ArrayList<>();
      for (int i = 0; i < jsonTestEvents.length(); i++) {
        JSONObject jsonTestEvent = jsonTestEvents.getJSONObject(i);
        testEvents.add(new TestEvent(jsonTestEvent.getString("type"), jsonTestEvent.getString("data"), jsonTestEvent.getInt("testEventId")));
      }
      return new FixtureServerInstance(manifestServerUrl, testEvents);
    } catch (IOException e) {
      e.printStackTrace();
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return null;
  }

  public static void reportTestResult(final boolean success, final String testName, final String logs) throws Exception {
    if (!isTestServerAvailable()) {
      return;
    }

    JSONObject jsonBody = new JSONObject();
    jsonBody.put("testRunId", ExponentBuildConstants.TEST_RUN_ID);
    jsonBody.put("testName", testName);
    jsonBody.put("success", success);
    jsonBody.put("logs", logs);
    jsonBody.put("deviceName", Build.MODEL);
    jsonBody.put("systemVersion", Build.VERSION.RELEASE);

    Request request = new Request.Builder()
        .url(ExponentBuildConstants.TEST_SERVER_URL + "/report-test-result")
        .post(RequestBody.create(JSON, jsonBody.toString()))
        .build();
    httpRequest(request);
  }

}
