package expo.modules.kotlin

import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.turbomodule.core.NativeMethodCallInvokerHolderImpl

typealias NativeMethodCallInvokerHolderImplCompatible = NativeMethodCallInvokerHolderImpl

object ReactNativeCompatibleHelper {
  fun getNativeMethodCallInvokerHolderImplCompatible(catalystInstance: CatalystInstance): NativeMethodCallInvokerHolderImplCompatible {
    return catalystInstance.nativeMethodCallInvokerHolder as NativeMethodCallInvokerHolderImplCompatible
  }
}
