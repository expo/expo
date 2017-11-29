package host.exp.exponent.utils;

import android.support.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import android.support.test.internal.util.AndroidRunnerParams;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.runner.Description;
import org.junit.runner.manipulation.Filter;
import org.junit.runner.manipulation.NoTestsRemainException;
import org.junit.runners.model.InitializationError;

import host.exp.exponent.annotations.ExpoAlwaysPassThroughFilter;
import host.exp.exponent.annotations.ExpoDevModeTest;
import host.exp.exponent.annotations.ExpoSdkVersionTest;
import host.exp.exponent.annotations.ExpoTestSuiteTest;

public class ExpoTestRunner extends AndroidJUnit4ClassRunner {

  public final static String TEST_TYPES_KEY = "includeTestTypes";
  public final static String TEST_SUITE_TEST_TYPE = "test-suite";
  public final static String DEV_MODE_TEST_TYPE = "dev-mode";
  public final static String SDK_VERSIONS_KEY = "includeSdkVersions";


  public static class ExpoTestFilter extends Filter {

    JSONObject testConfig;

    public ExpoTestFilter() {
      testConfig = TestConfig.get();
    }

    @Override
    public boolean shouldRun(Description description) {
      if (description.getAnnotation(ExpoAlwaysPassThroughFilter.class) != null) {
        return true;
      }

      JSONArray testTypes = testConfig.optJSONArray(TEST_TYPES_KEY);
      if (testTypes != null) {
        boolean foundTestType = false;
        for (int i = 0; i < testTypes.length(); i++) {
          if (testTypes.optString(i).equals(TEST_SUITE_TEST_TYPE) && description.getAnnotation(ExpoTestSuiteTest.class) != null) {
            foundTestType = true;
          } else if (testTypes.optString(i).equals(DEV_MODE_TEST_TYPE) && description.getAnnotation(ExpoDevModeTest.class) != null) {
            foundTestType = true;
          }
        }

        if (!foundTestType) {
          return false;
        }
      }

      JSONArray sdkVersions = testConfig.optJSONArray(SDK_VERSIONS_KEY);
      ExpoSdkVersionTest sdkVersionAnnotation = description.getAnnotation(ExpoSdkVersionTest.class);
      if (sdkVersions != null && sdkVersionAnnotation != null) {
        boolean foundSdkVersion = false;
        for (int i = 0; i < sdkVersions.length(); i++) {
          if (sdkVersionAnnotation.value().equals(sdkVersions.optString(i))) {
            foundSdkVersion = true;
          }
        }

        if (!foundSdkVersion) {
          return false;
        }
      }

      return true;
    }

    @Override
    public String describe() {
      return "Filters tests based on TEST_CONFIG env var";
    }
  }

  public ExpoTestRunner(Class<?> klass, AndroidRunnerParams runnerParams) throws InitializationError {
    super(klass, runnerParams);

    ExpoTestFilter filter = new ExpoTestFilter();
    try {
      filter.apply(this);
    } catch (NoTestsRemainException e) {
      throw new RuntimeException(e);
    }
  }
}
