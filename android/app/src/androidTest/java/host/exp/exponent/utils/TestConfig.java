package host.exp.exponent.utils;

import org.json.JSONObject;

import host.exp.exponent.generated.ExponentBuildConstants;

public class TestConfig {

  public static JSONObject get() {
    try {
      return new JSONObject(ExponentBuildConstants.TEST_CONFIG);
    } catch (Throwable e) {
      return new JSONObject();
    }
  }

}
