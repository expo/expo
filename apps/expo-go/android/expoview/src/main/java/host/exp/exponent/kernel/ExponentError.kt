// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import android.os.Bundle
import org.json.JSONException
import org.json.JSONObject
import java.util.*

class ExponentError(
  val errorMessage: ExponentErrorMessage,
  val errorHeader: String?,
  val stack: Array<Bundle>,
  val exceptionId: Int,
  val isFatal: Boolean,
  val canRetry: Boolean = true
) {
  val timestamp: Date = Calendar.getInstance().time

  fun toJSONObject(): JSONObject? {
    return try {
      JSONObject().apply {
        put("errorHeader", errorHeader)
        put("errorMessage", errorMessage.developerErrorMessage())
        put("exceptionId", exceptionId)
        put("isFatal", isFatal)
        put("canRetry", canRetry)
      }
    } catch (e: JSONException) {
      null
    }
  }
}
