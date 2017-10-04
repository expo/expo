// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.util.Log;

import org.junit.rules.TestRule;
import org.junit.runner.Description;
import org.junit.runners.model.Statement;

public class TestReporterRule implements TestRule {

  private static final String TAG = "EXPO_TEST_REPORTER";

  private String mLogs = "";

  public void logTestInfo(final String log) {
    mLogs += log + "\n";
  }

  private void reportResult(final boolean success, final String testName) {
    try {
      TestServerUtils.reportTestResult(success, testName, mLogs);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  @Override
  public Statement apply(Statement base, Description description) {
    return statement(base, description);
  }

  private Statement statement(final Statement base, final Description description) {
    return new Statement() {
      @Override
      public void evaluate() throws Throwable {
        Log.d(TAG, "start_test_" + description.getDisplayName());
        try {
          mLogs = "";
          base.evaluate();
          Log.d(TAG, "end_test_" + description.getDisplayName());
          reportResult(true, description.getDisplayName());
          return;
        } catch (Throwable t) {
          Log.d(TAG, "end_test_" + description.getDisplayName());
          reportResult(false, description.getDisplayName());
          throw t;
        }
      }
    };
  }
}