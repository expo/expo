package expo.modules.kotlin

import android.os.Bundle
import com.facebook.react.bridge.Arguments
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.toJSMap

class KPromiseWrapper(
  private val bridgePromise: com.facebook.react.bridge.Promise
) : Promise {

  @Suppress("UNCHECKED_CAST")
  override fun resolve(value: Any?) {
    bridgePromise.resolve(
      when (value) {
        is Unit -> null
        is Bundle -> Arguments.fromBundle(value)
        is List<*> -> Arguments.fromList(value)
        is Array<*> -> Arguments.fromArray(value)
        is Map<*, *> -> Arguments.makeNativeMap(value as Map<String, Any?>) // TODO(@lukmccall): add more sophisticated conversion method
        is Record -> value.toJSMap()
        else -> value
      }
    )
  }

  override fun reject(code: String, message: String?, cause: Throwable?) {
    bridgePromise.reject(code, message, cause)
  }
}
