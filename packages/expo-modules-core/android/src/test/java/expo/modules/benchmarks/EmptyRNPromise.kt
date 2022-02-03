package expo.modules.benchmarks

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap

class EmptyRNPromise : Promise {
  override fun resolve(value: Any?) = Unit

  override fun reject(code: String?, message: String?) = Unit

  override fun reject(code: String?, throwable: Throwable?) = Unit

  override fun reject(code: String?, message: String?, throwable: Throwable?) = Unit

  override fun reject(throwable: Throwable?) = Unit
  override fun reject(throwable: Throwable?, userInfo: WritableMap?) = Unit

  override fun reject(code: String?, userInfo: WritableMap) = Unit

  override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap?) = Unit

  override fun reject(code: String?, message: String?, userInfo: WritableMap) = Unit

  override fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?) = Unit

  override fun reject(message: String?) = Unit
}
