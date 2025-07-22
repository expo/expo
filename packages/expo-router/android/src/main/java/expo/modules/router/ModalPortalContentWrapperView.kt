package expo.modules.router

import android.content.Context
import android.util.Log
import com.facebook.react.views.view.ReactViewGroup
import java.lang.ref.WeakReference

class ModalPortalContentWrapperView(context: Context) :
  ReactViewGroup(context) {
  private var host: WeakReference<ModalPortalHostView?> = WeakReference(null)
  private var contentView: WeakReference<ModalPortalContentView?> = WeakReference(null)

  fun setContentView(child: ModalPortalContentView){
    if (contentView.get() != null) {
      Log.w(
        "ExpoRouter",
        "Warning: Multiple ModalPortalContentView components found. Only the first one will be used."
      )
    }
    host.get()?.setContentView(child)
    contentView = WeakReference(child)
  }

  fun unsetContentView() {
    val contentView = this.contentView.get()
    if (contentView == null) {
      Log.w(
        "ExpoRouter",
        "Warning: Removing child that does not exist from ModalPortalContentWrapperView"
      )
    } else {
      this.host.get()?.unmountContentView()
    }
    this.contentView = WeakReference(null)
  }

  fun setHostId(hostId: String) {
    val hostView = PortalHostsRegistry.getHost(hostId)
    if (hostView != null) {
      host = WeakReference(hostView)
      val contentView = this.contentView.get()
      if (contentView != null) {
        hostView.setContentView(contentView)
      }
    } else {
      Log.w("ExpoRouter", "Host view with id $hostId not found")
    }
  }
}
