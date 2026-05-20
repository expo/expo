package expo.modules.kotlin.views

import android.os.Handler
import android.os.Looper
import android.view.View

/**
 * Runs a callback only when a view is attached after staying detached through one main-loop turn.
 * React Native can synchronously detach and reattach native children during view reparenting, and
 * those moves should not be treated like a full detach.
 */
internal class OnAttachAfterDetachmentListener(
  private val onAttachAfterDetachment: () -> Unit,
  private val post: (Runnable) -> Unit = { runnable ->
    Handler(Looper.getMainLooper()).post(runnable)
  }
) : View.OnAttachStateChangeListener {
  private var shouldRunOnAttach = false
  private var detachGeneration = 0

  override fun onViewAttachedToWindow(v: View) {
    detachGeneration += 1

    if (shouldRunOnAttach) {
      shouldRunOnAttach = false
      onAttachAfterDetachment()
    }
  }

  override fun onViewDetachedFromWindow(v: View) {
    val generation = ++detachGeneration

    post(
      Runnable {
        if (detachGeneration == generation && !v.isAttachedToWindow) {
          shouldRunOnAttach = true
        }
      }
    )
  }
}
