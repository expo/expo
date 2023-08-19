package expo.modules.kotlin

import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl

typealias NativeMethodCallInvokerHolderImplCompatible = CallInvokerHolderImpl

object ReactNativeCompatibleHelper {
  fun getNativeMethodCallInvokerHolderImplCompatible(catalystInstance: CatalystInstance): NativeMethodCallInvokerHolderImplCompatible {
    return catalystInstance.nativeCallInvokerHolder as NativeMethodCallInvokerHolderImplCompatible
  }
}
