package expo.modules.imagepicker

import android.os.Bundle
import expo.modules.core.Promise

/**
 * Class that represents a promise, which will not resolve immediately but saves results to the [PickerResultsStore].
 */
class PendingPromise(
  private val pickerResultsStore: PickerResultsStore,
  private val isBase64: Boolean = false
) : Promise {

  @Throws(IllegalArgumentException::class)
  override fun resolve(value: Any?) {
    if (value is Bundle) {
      if (isBase64 && value.containsKey("type")) {
        value.putBoolean("base64", value.getString("type") == "image")
      }
      pickerResultsStore.addPendingResult(value)
      return
    }

    throw IllegalArgumentException("Can not resolve 'DestroyedPromise' with anything else then 'Bundle'.")
  }

  override fun reject(code: String, message: String, e: Throwable?) {
    pickerResultsStore.addPendingResult(
      Bundle().apply {
        putString("code", code)
        putString("message", message)
        e?.let {
          putString("exception", it.toString())
        }
      }
    )
  }
}
