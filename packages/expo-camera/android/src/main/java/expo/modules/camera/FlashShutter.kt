package expo.modules.camera

import android.graphics.Color
import android.view.View
import androidx.core.graphics.drawable.toDrawable

internal fun flashShutter(view: View) {
  view.rootView.postDelayed({
    // `rootView` changes if the camera view detaches, so the clear must use the same view.
    val root = view.rootView
    root.foreground = Color.WHITE.toDrawable()
    root.postDelayed({ root.foreground = null }, ANIMATION_FAST_MILLIS)
  }, ANIMATION_SLOW_MILLIS)
}
