package expo.modules.keepawake

import android.view.WindowManager
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpoKeepAwakeManager(
  private val reactContextProvider: () -> ReactContext?
) : LifecycleEventListener {
  private val tags = mutableSetOf<String>()

  val isActivated: Boolean
    get() = tags.isNotEmpty()

  suspend fun activate(tag: String): Unit = withContext(Dispatchers.Main) {
    tags.add(tag)
    reactContextProvider()?.addLifecycleEventListener(this@ExpoKeepAwakeManager)
    syncKeepScreenOnFlag()
  }

  suspend fun deactivate(tag: String): Unit = withContext(Dispatchers.Main) {
    tags.remove(tag)
    syncKeepScreenOnFlag()
  }

  override fun onHostResume() = syncKeepScreenOnFlag()

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  private fun syncKeepScreenOnFlag() {
    val window = reactContextProvider()?.currentActivity?.window ?: return
    if (isActivated) {
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    } else {
      window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
  }
}
