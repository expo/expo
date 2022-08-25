package expo.modules.av

import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.UIManagerHelper
import expo.modules.av.video.VideoView
import expo.modules.av.video.VideoViewWrapper
import expo.modules.core.Promise

object ViewUtils {
  interface VideoViewCallback {
    fun runWithVideoView(videoView: VideoView): Unit
  }

  @UiThread
  private fun tryRunWithVideoViewOnUiThread(reactContext: ReactContext, viewTag: Int, callback: VideoViewCallback, promise: Promise) {
    val videoWrapperView = UIManagerHelper.getUIManagerForReactTag(reactContext, viewTag)?.resolveView(viewTag) as VideoViewWrapper?
    val videoView = videoWrapperView?.videoViewInstance
    if (videoView != null) {
      callback.runWithVideoView(videoView)
    } else {
      promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.")
    }
  }

  /**
   * Rejects the promise if the VideoView is not found, otherwise executes the callback.
   */
  @JvmStatic
  @AnyThread
  @Deprecated("Use `dispatchCommands` in favor of finding view with imperative calls")
  fun tryRunWithVideoView(reactContext: ReactContext, viewTag: Int, callback: VideoViewCallback, promise: Promise) {
    if (UiThreadUtil.isOnUiThread()) {
      tryRunWithVideoViewOnUiThread(reactContext, viewTag, callback, promise)
    } else {
      UiThreadUtil.runOnUiThread {
        tryRunWithVideoViewOnUiThread(reactContext, viewTag, callback, promise)
      }
    }
  }
}
