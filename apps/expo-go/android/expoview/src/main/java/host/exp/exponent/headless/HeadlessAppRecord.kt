package host.exp.exponent.headless

import android.os.Handler
import host.exp.exponent.taskManager.AppRecordInterface
import android.os.Looper
import com.facebook.react.ReactHost

class HeadlessAppRecord : AppRecordInterface {
  private var reactHost: ReactHost? = null

  fun setReactHost(reactHost: ReactHost) {
    this.reactHost = reactHost
  }

  override fun invalidate() {
    val reactHostTemp = reactHost
    if (reactHostTemp != null) {
      this.reactHost = null

      // `destroy` must be called on UI thread.
      Handler(Looper.getMainLooper()).post {
        reactHostTemp.destroy("", null)
      }
    }
  }
}
