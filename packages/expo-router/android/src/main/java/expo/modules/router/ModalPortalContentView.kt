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
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    hostComponent = WeakReference(null)
  }
}
