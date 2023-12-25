// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.util.Log
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement
import java.lang.Exception

class TestReporterRule : TestRule {
  private var logs = ""
  fun logTestInfo(log: String) {
    logs += log + "\n"
  }

  private fun reportResult(success: Boolean, testName: String) {
    try {
      TestServerUtils.reportTestResult(success, testName, logs)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  override fun apply(base: Statement, description: Description): Statement {
    return statement(base, description)
  }

  private fun statement(base: Statement, description: Description): Statement {
    return object : Statement() {
      @Throws(Throwable::class)
      override fun evaluate() {
        Log.d(TAG, "start_test_" + description.displayName)
        try {
          logs = ""
          base.evaluate()
          Log.d(TAG, "end_test_" + description.displayName)
          reportResult(true, description.displayName)
          return
        } catch (t: Throwable) {
          Log.d(TAG, "end_test_" + description.displayName)
          reportResult(false, description.displayName)
          throw t
        }
      }
    }
  }

  companion object {
    private const val TAG = "EXPO_TEST_REPORTER"
  }
}
