package expo.modules.notifications

import android.os.Bundle
import android.os.Handler
import android.os.ResultReceiver

typealias ResultReceiverBody = (resultCode: Int, resultData: Bundle) -> Unit

internal fun createDefaultResultReceiver(
  handler: Handler?,
  body: (resultCode: Int, resultData: Bundle) -> Unit
): ResultReceiver {
  return object : ResultReceiver(handler) {
    override fun onReceiveResult(resultCode: Int, resultData: Bundle) {
      super.onReceiveResult(resultCode, resultData)
      body(resultCode, resultData)
    }
  }
}
