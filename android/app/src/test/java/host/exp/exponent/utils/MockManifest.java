package host.exp.exponent.utils;

import org.json.JSONException;
import org.json.JSONObject;

public class MockManifest {

  private static final String MANIFEST_TEMPLATE = "{\n" +
      "  \"description\": \"This project is really great.\",\n" +
      "  \"icon\": \"./assets/icon.png\",\n" +
      "  \"iconUrl\": \"https://d1wp6m56sqw74a.cloudfront.net/~assets/fa6577fecc0a7838f15a254577639984\",\n" +
      "  \"isDetached\": true,\n" +
      "  \"name\": \"test-fetch-update\",\n" +
      "  \"orientation\": \"portrait\",\n" +
      "  \"platforms\": [\n" +
      "    \"ios\",\n" +
      "    \"android\"\n" +
      "  ],\n" +
      "  \"privacy\": \"unlisted\",\n" +
      "  \"scheme\": \"expd9c42d5111d849f4b99796c00769433d\",\n" +
      "  \"sdkVersion\": \"27.0.0\",\n" +
      "  \"slug\": \"test-fetch-update\",\n" +
      "  \"splash\": {\n" +
      "    \"backgroundColor\": \"#ffffff\",\n" +
      "    \"image\": \"./assets/splash.png\",\n" +
      "    \"imageUrl\": \"https://d1wp6m56sqw74a.cloudfront.net/~assets/43ec0dcbe5a156bf9e650bb8c15e7af6\",\n" +
      "    \"resizeMode\": \"contain\"\n" +
      "  },\n" +
      "  \"updates\": {\n" +
      "    \"checkAutomatically\": \"ON_ERROR_RECOVERY\",\n" +
      "    \"fallbackToCacheTimeout\": 0\n" +
      "  },\n" +
      "  \"version\": \"1.0.0\",\n" +
      "  \"id\": \"@esamelson/test-fetch-update\",\n" +
      "  \"revisionId\": \"1.0.0-r.OMmv5zPpWL\",\n" +
      "  \"publishedTime\": \"2018-05-30T21:43:20.000Z\",\n" +
      "  \"bundleUrl\": \"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Ftest-fetch-update%2F1.0.0%2F48ac93db1a7b9d0aaec894223a36a7fe-27.0.0-ios.js\",\n" +
      "  \"releaseChannel\": \"default\",\n" +
      "  \"hostUri\": \"exp.host/@esamelson/test-fetch-update\"\n" +
      "}";

  private JSONObject mManifest;

  public MockManifest() {
    try {
      mManifest = new JSONObject(MANIFEST_TEMPLATE);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public MockManifest updatesCheckAutomatically(final String value) {
    try {
      JSONObject updates = mManifest.getJSONObject("updates");
      updates.put("checkAutomatically", value);
      mManifest.put("updates", updates);
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return this;
  }

  public MockManifest updatesFallbackToCacheTimeout(final long value) {
    try {
      JSONObject updates = mManifest.getJSONObject("updates");
      updates.put("fallbackToCacheTimeout", value);
      mManifest.put("updates", updates);
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return this;
  }

  public MockManifest version(final String value) {
    try {
      mManifest.put("version", value);
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return this;
  }

  public MockManifest revisionId(final String value) {
    try {
      mManifest.put("revisionId", value);
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return this;
  }

  public MockManifest publishedTime(final String value) {
    try {
      mManifest.put("publishedTime", value);
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return this;
  }

  public MockManifest bundleUrl(final String value) {
    try {
      mManifest.put("bundleUrl", value);
    } catch (JSONException e) {
      e.printStackTrace();
    }

    return this;
  }

  @Override
  public String toString() {
    return mManifest.toString();
  }
}
