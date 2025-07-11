package expo.modules.router

import android.content.Context
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference
import com.facebook.react.uimanager.PixelUtil
import expo.modules.kotlin.viewevent.EventDispatcher

class ModalPortalHostView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  var hostId: String = ""
    set(value) {
      if (field == value) {
        return
      }
      PortalHostsRegistry.unregister(field)
      onUnregistered(
        mapOf(
          "hostId" to field
        )
      )
      field = value
      PortalHostsRegistry.register(this)
      onRegistered(
        mapOf(
          "hostId" to value
        )
      )
    }
  private var contentView: WeakReference<ModalPortalContentView?> = WeakReference(null)

  private val onRegistered by EventDispatcher()
  private val onUnregistered by EventDispatcher()

  fun setContentView(contentView: ModalPortalContentView) {
    unmountContentView()

    this.contentView = WeakReference(contentView)
    contentView.setHostComponent(this)

    addView(contentView)
  }

  fun unmountContentView() {
    val contentView = this.contentView.get()
    if (contentView != null) {
      removeView(contentView)
      this.contentView = WeakReference(null)
    }
  }

  override fun onDetachedFromWindow() {
    PortalHostsRegistry.unregister(hostId)
    onUnregistered(
      mapOf(
        "hostId" to hostId
      )
    )
    super.onDetachedFromWindow()
  }
}
