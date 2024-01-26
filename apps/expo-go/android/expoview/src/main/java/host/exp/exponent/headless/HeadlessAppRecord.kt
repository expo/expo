package host.exp.exponent.headless

import android.os.Handler
import host.exp.exponent.taskManager.AppRecordInterface
import host.exp.exponent.RNObject
import android.os.Looper

class HeadlessAppRecord : AppRecordInterface {
  private var reactInstanceManager: RNObject? = null

  fun setReactInstanceManager(reactInstanceManager: RNObject?) {
    this.reactInstanceManager = reactInstanceManager
  }

  override fun invalidate() {
    val reactInstanceManagerTemp = reactInstanceManager
    if (reactInstanceManagerTemp != null) {
      this.reactInstanceManager = null

      // `destroy` must be called on UI thread.
      Handler(Looper.getMainLooper()).post {
        if (reactInstanceManagerTemp.isNotNull) {
          reactInstanceManagerTemp.call("destroy")
        }
      }
    }
  }
}
