package abi47_0_0.expo.modules.av

import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import abi47_0_0.com.facebook.react.bridge.UiThreadUtil
import abi47_0_0.com.facebook.react.uimanager.IllegalViewOperationException
import abi47_0_0.expo.modules.av.video.VideoView
import abi47_0_0.expo.modules.av.video.VideoViewWrapper
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.interfaces.services.UIManager

object ViewUtils {
  interface VideoViewCallback {
    fun runWithVideoView(videoView: VideoView): Unit
  }

  @UiThread
  private fun tryRunWithVideoViewOnUiThread(moduleRegistry: ModuleRegistry, viewTag: Int, callback: VideoViewCallback, promise: Promise) {
    try {
      val videoWrapperView = moduleRegistry.getModule(UIManager::class.java).resolveView(viewTag) as VideoViewWrapper?
      val videoView = videoWrapperView?.videoViewInstance
      if (videoView != null) {
        callback.runWithVideoView(videoView)
      } else {
        promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.")
      }
    } catch (e: IllegalViewOperationException) {
      promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.")
    }
  }

  /**
   * Rejects the promise if the VideoView is not found, otherwise executes the callback.
   */
  @JvmStatic
  @AnyThread
  @Deprecated("Use `dispatchCommands` in favor of finding view with imperative calls")
  fun tryRunWithVideoView(moduleRegistry: ModuleRegistry, viewTag: Int, callback: VideoViewCallback, promise: Promise) {
    if (UiThreadUtil.isOnUiThread()) {
      tryRunWithVideoViewOnUiThread(moduleRegistry, viewTag, callback, promise)
    } else {
      UiThreadUtil.runOnUiThread {
        tryRunWithVideoViewOnUiThread(moduleRegistry, viewTag, callback, promise)
      }
    }
  }

  @UiThread
  private fun tryRunWithVideoViewOnUiThread(moduleRegistry: ModuleRegistry, viewTag: Int, callback: VideoViewCallback, promise: abi47_0_0.expo.modules.kotlin.Promise) {
    try {
      val videoWrapperView = moduleRegistry.getModule(UIManager::class.java).resolveView(viewTag) as VideoViewWrapper?
      val videoView = videoWrapperView?.videoViewInstance
      if (videoView != null) {
        callback.runWithVideoView(videoView)
      } else {
        promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.", null)
      }
    } catch (e: IllegalViewOperationException) {
      promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.", null)
    }
  }

  /**
   * Rejects the promise if the VideoView is not found, otherwise executes the callback.
   */
  @AnyThread
  @Deprecated("Use `dispatchCommands` in favor of finding view with imperative calls")
  fun tryRunWithVideoView(moduleRegistry: ModuleRegistry, viewTag: Int, callback: VideoViewCallback, promise: abi47_0_0.expo.modules.kotlin.Promise) {
    if (UiThreadUtil.isOnUiThread()) {
      tryRunWithVideoViewOnUiThread(moduleRegistry, viewTag, callback, promise)
    } else {
      UiThreadUtil.runOnUiThread {
        tryRunWithVideoViewOnUiThread(moduleRegistry, viewTag, callback, promise)
      }
    }
  }
}
