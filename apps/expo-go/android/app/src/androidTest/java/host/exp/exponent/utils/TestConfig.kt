package host.exp.exponent.utils

import host.exp.exponent.generated.ExponentBuildConstants
import org.json.JSONObject

object TestConfig {
  fun get(): JSONObject {
    return try {
      JSONObject(ExponentBuildConstants.TEST_CONFIG)
    } catch (e: Throwable) {
      JSONObject()
    }
  }
}
