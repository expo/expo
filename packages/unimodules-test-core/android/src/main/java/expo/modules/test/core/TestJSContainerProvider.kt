package expo.modules.test.core

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.types.JSTypeConverter

object TestJSContainerProvider : JSTypeConverter.ContainerProvider {
  override fun createMap(): WritableMap = JavaOnlyMap()
  override fun createArray(): WritableArray = JavaOnlyArray()
}
