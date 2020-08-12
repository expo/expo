package expo.modules.imagepicker

import android.os.Bundle
import org.unimodules.core.Promise

/**
 * Class that represents a promise, which will not resolve immediately but saves results to the [PickerResultsStore].
 */
class PendingPromise(private val pickerResultsStore: PickerResultsStore) : Promise {

  @Throws(IllegalArgumentException::class)
  override fun resolve(value: Any?) {
    if (value is Bundle) {
      pickerResultsStore.addPendingResult(value)
      return
    }

    throw IllegalArgumentException("Can not resolve 'DestroyedPromise' with anything else then 'Bundle'.")
  }

  override fun reject(code: String, message: String, e: Throwable?) {
    pickerResultsStore.addPendingResult(Bundle().apply {
      putString("code", code)
      putString("message", message)
      e?.let {
        putString("exception", it.toString())
      }
    })
  }
}
