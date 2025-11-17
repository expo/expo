package expo.modules.blur

import android.annotation.SuppressLint
import android.content.Context
import eightbitlab.com.blurview.BlurTarget
import expo.modules.kotlin.AppContext

class UIManagerCompatibleBlurTarget(appContext: AppContext, context: Context) : BlurTarget(context) {
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // No-op since UIManager handles actually laying out children.
  }

  @SuppressLint("MissingSuperCall")
  override fun requestLayout() {
    // No-op, terminate `requestLayout` here, UIManager handles laying out children and
    // `layout` is called on all RN-managed views by `NativeViewHierarchyManager`
  }
}
