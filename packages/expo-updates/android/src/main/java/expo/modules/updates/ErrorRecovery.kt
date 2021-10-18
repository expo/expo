package expo.modules.updates

import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.DefaultNativeModuleCallExceptionHandler
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.devsupport.DisabledDevSupportManager
import java.lang.Exception
import java.lang.RuntimeException

class ErrorRecovery {

  fun registerObservers(reactNativeHost: ReactNativeHost?) {
    ReactMarker.addListener { name, tag, instanceKey ->
      if (name == ReactMarkerConstants.CONTENT_APPEARED) {
        Log.d("erictest", "content appeared")
        // make sure this works after reload
      } else if (name == ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_END) {
        reactNativeHost?.let {
          registerErrorHandler(it.reactInstanceManager)
        }
      }
    }
    // TODO: failed to load handler?
  }

  fun registerErrorHandler(reactInstanceManager: ReactInstanceManager) {
    val devSupportManager = reactInstanceManager.devSupportManager as DisabledDevSupportManager // TODO: make this cast safe
    val defaultNativeModuleCallExceptionHandler = object : DefaultNativeModuleCallExceptionHandler() {
      override fun handleException(e: Exception?) {
        Log.d("erictest", "dev support manager caught exception " + e?.message)
        throw RuntimeException(e)
      }
    }
    val devSupportManagerClass = devSupportManager.javaClass
    val previousHandler = devSupportManagerClass.getDeclaredField("mDefaultNativeModuleCallExceptionHandler").let {
      it.isAccessible = true
      val previousValue = it[devSupportManager]
      it[devSupportManager] = defaultNativeModuleCallExceptionHandler
      return@let previousValue
    }
    // TODO: replace in react instance manager too?? probably not
  }
}