package expo.modules.test.core.legacy

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.types.JSTypeConverterProvider

internal object TestJSContainerProvider : JSTypeConverterProvider.ContainerProvider {
  override fun createMap(): WritableMap = JavaOnlyMap()
  override fun createArray(): WritableArray = JavaOnlyArray()
}
