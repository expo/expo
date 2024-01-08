package host.exp.exponent.utils

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import host.exp.exponent.annotations.ExpoAlwaysPassThroughFilter
import host.exp.exponent.annotations.ExpoDevModeTest
import host.exp.exponent.annotations.ExpoSdkVersionTest
import host.exp.exponent.annotations.ExpoTestSuiteTest
import org.json.JSONObject
import org.junit.runner.Description
import org.junit.runner.manipulation.Filter
import org.junit.runner.manipulation.NoTestsRemainException

class ExpoTestRunner(klass: Class<*>?) : AndroidJUnit4ClassRunner(klass) {
  class ExpoTestFilter : Filter() {
    private val testConfig: JSONObject = TestConfig.get()

    override fun shouldRun(description: Description): Boolean {
      if (description.getAnnotation(ExpoAlwaysPassThroughFilter::class.java) != null) {
        return true
      }
      val testTypes = testConfig.optJSONArray(TEST_TYPES_KEY)
      if (testTypes != null) {
        var foundTestType = false
        for (i in 0 until testTypes.length()) {
          if (testTypes.optString(i) == TEST_SUITE_TEST_TYPE && description.getAnnotation(
              ExpoTestSuiteTest::class.java
            ) != null
          ) {
            foundTestType = true
          } else if (testTypes.optString(i) == DEV_MODE_TEST_TYPE && description.getAnnotation(
              ExpoDevModeTest::class.java
            ) != null
          ) {
            foundTestType = true
          }
        }
        if (!foundTestType) {
          return false
        }
      }
      val sdkVersions = testConfig.optJSONArray(SDK_VERSIONS_KEY)
      val sdkVersionAnnotation = description.getAnnotation(
        ExpoSdkVersionTest::class.java
      )
      if (sdkVersions != null && sdkVersionAnnotation != null) {
        var foundSdkVersion = false
        for (i in 0 until sdkVersions.length()) {
          if (sdkVersionAnnotation.value == sdkVersions.optString(i)) {
            foundSdkVersion = true
          }
        }
        if (!foundSdkVersion) {
          return false
        }
      }
      return true
    }

    override fun describe(): String {
      return "Filters tests based on TEST_CONFIG env var"
    }
  }

  companion object {
    const val TEST_TYPES_KEY = "includeTestTypes"
    const val TEST_SUITE_TEST_TYPE = "test-suite"
    const val DEV_MODE_TEST_TYPE = "dev-mode"
    const val SDK_VERSIONS_KEY = "includeSdkVersions"
  }

  init {
    val filter = ExpoTestFilter()
    try {
      filter.apply(this)
    } catch (e: NoTestsRemainException) {
      throw RuntimeException(e)
    }
  }
}
