package expo.modules.updates

import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import java.lang.RuntimeException

class ErrorRecovery {

  fun registerObservers() {
    ReactMarker.addListener { name, tag, instanceKey ->
      if (name == ReactMarkerConstants.CONTENT_APPEARED) {
        Log.d("erictest", "content appeared");
        // make sure this works after reload
      }
    }
    // TODO: failed to load?
  }

  fun registerErrorHandler(reactInstanceManager: ReactInstanceManager) {
    val reactContext = reactInstanceManager.currentReactContext
    // TODO: way to preserve old handler that isn't default?
    // TODO: make sure this still works after reload
    reactContext?.setNativeModuleCallExceptionHandler {
      Log.d("erictest", "caught exception " + it.message);
      throw RuntimeException(it)
    }
  }
}