package expo.modules.router

import android.content.Context
import com.facebook.react.uimanager.PixelUtil
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

class ModalPortalContentView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {

  private var hostComponent: WeakReference<ModalPortalHostView?> = WeakReference(null)

  fun setHostComponent(hostComponent: ModalPortalHostView) {
    this.hostComponent = WeakReference(hostComponent)
    hostComponent.setSize(width, height)
  }

  fun setSize(width: Int, height: Int) {
    shadowNodeProxy.setViewSize(
      PixelUtil.toDIPFromPixel(width.toFloat()).toDouble(),
      PixelUtil.toDIPFromPixel(height.toFloat()).toDouble()
    )
    layout(0, 0, width, height)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    hostComponent = WeakReference(null)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)
    if (changed) {
      hostComponent.get()?.setSize(r - l, b - t)
    }
  }
}
