package expo.modules.router

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

class ModalPortalContentWrapperView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  private var host: WeakReference<ModalPortalHostView?> = WeakReference(null)
  private var contentView: WeakReference<ModalPortalContentView?> = WeakReference(null)

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    if (contentView.get() != null) {
      Log.w(
        "ExpoRouter",
        "Warning: Multiple ModalPortalContentView components found. Only the first one will be used."
      )
    }
    if (child is ModalPortalContentView) {
      host.get()?.setContentView(child)
      contentView = WeakReference(child)
    } else {
      Log.w("ExpoRouter", "Mounting: Child component view must be of type ModalPortalContentView")
    }
  }

  override fun removeViewAt(index: Int) {
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
