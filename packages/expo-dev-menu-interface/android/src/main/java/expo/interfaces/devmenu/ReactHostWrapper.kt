@file:Suppress("DEPRECATION")

package expo.interfaces.devmenu

import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.runtime.ReactHostImpl

/**
 * An abstract wrapper to host [ReactNativeHost] and [ReactHost],
 * so that call-sites do not have to handle the difference between legacy bridge and bridgeless mode.
 */
class ReactHostWrapper(reactNativeHost: ReactNativeHost, reactHostProvider: () -> ReactHost?) {
  lateinit var reactNativeHost: ReactNativeHost
  lateinit var reactHost: ReactHost

  init {
    if (ReactFeatureFlags.enableBridgelessArchitecture) {
      this.reactHost = requireNotNull(reactHostProvider())
    } else {
      this.reactNativeHost = reactNativeHost
    }
  }

  val currentReactContext: ReactContext?
    get() {
      return if (isBridgelessMode) {
        reactHost.currentReactContext
      } else {
        reactNativeHost.reactInstanceManager.currentReactContext
      }
    }

  val lifecycleState: LifecycleState
    get() {
      return if (isBridgelessMode) {
        reactHost.lifecycleState
      } else {
        reactNativeHost.reactInstanceManager.lifecycleState
      }
    }

  val hasInstance: Boolean
    get() {
      if (isBridgelessMode) {
        return currentReactContext?.hasActiveReactInstance() ?: false
      }
      return reactNativeHost.hasInstance() && currentReactContext?.hasActiveReactInstance() ?: false
    }

  val devSupportManager: DevSupportManager?
    get() {
      return if (isBridgelessMode) {
        reactHost.devSupportManager
      } else {
        reactNativeHost.reactInstanceManager.devSupportManager
      }
    }

  val isBridgelessMode = ReactFeatureFlags.enableBridgelessArchitecture

  val jsExecutorName: String
    get() {
      if (isBridgelessMode) {
        return if (reactHost.jsEngineResolutionAlgorithm == JSEngineResolutionAlgorithm.JSC) {
          "JSC"
        } else {
          "Hermes"
        }
      }

      return reactNativeHost.reactInstanceManager.jsExecutorName
    }

  fun addReactInstanceEventListener(listener: ReactInstanceEventListener) {
    if (isBridgelessMode) {
      (reactHost as ReactHostImpl).addReactInstanceEventListener(listener)
    } else {
      reactNativeHost.reactInstanceManager.addReactInstanceEventListener(listener)
    }
  }

  fun removeReactInstanceEventListener(listener: ReactInstanceEventListener) {
    if (isBridgelessMode) {
      (reactHost as ReactHostImpl).removeReactInstanceEventListener(listener)
    } else {
      reactNativeHost.reactInstanceManager.removeReactInstanceEventListener(listener)
    }
  }

  fun start() {
    if (isBridgelessMode) {
      (reactHost as ReactHostImpl).start()
    } else {
      reactNativeHost.reactInstanceManager.createReactContextInBackground()
    }
  }

  fun destroy(reason: String = "DevLauncher reloading app") {
    if (isBridgelessMode) {
      reactHost.destroy(reason, null)
    } else {
      reactNativeHost.clear()
    }
  }

  override fun hashCode(): Int {
    return if (isBridgelessMode) {
      reactHost.hashCode()
    } else {
      reactNativeHost.hashCode()
    }
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (javaClass != other?.javaClass) return false

    other as ReactHostWrapper

    if (reactNativeHost != other.reactNativeHost) return false
    if (reactHost != other.reactHost) return false

    return true
  }
}
