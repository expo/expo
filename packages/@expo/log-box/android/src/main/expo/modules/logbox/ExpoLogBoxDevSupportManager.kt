/*
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/krystofwoldrich/react-native/blob/7db31e2fca0f828aa6bf489ae6dc4adef9b7b7c3/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgelessDevSupportManager.kt
 */

package expo.modules.logbox

import android.content.Context
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler
import com.facebook.react.devsupport.StackTraceHelper.convertJavaStackTrace
import com.facebook.react.devsupport.StackTraceHelper.convertJsStackTrace
import com.facebook.react.devsupport.interfaces.StackFrame

class ExpoLogBoxDevSupportManager(
  applicationContext: Context,
  reactInstanceManagerHelper: ReactInstanceDevHelper,
  packagerPathForJSBundleName: String?,
  enableOnCreate: Boolean,
  redBoxHandler: RedBoxHandler?,
  devBundleDownloadListener: DevBundleDownloadListener?,
  minNumShakes: Int,
  customPackagerCommandHandlers: Map<String, RequestHandler>?,
  surfaceDelegateFactory: SurfaceDelegateFactory?,
  devLoadingViewManager: DevLoadingViewManager?,
  pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?
) :
  ExpoBridgelessDevSupportManager(
    applicationContext,
    reactInstanceManagerHelper,
    packagerPathForJSBundleName,
    enableOnCreate,
    redBoxHandler,
    devBundleDownloadListener,
    minNumShakes,
    customPackagerCommandHandlers,
    surfaceDelegateFactory,
    devLoadingViewManager,
    pausedInDebuggerOverlayManager
  ) {

  private var redBoxSurfaceDelegate: SurfaceDelegate? = null

  override fun hideRedboxDialog() {
    redBoxSurfaceDelegate?.hide()
  }

  override fun showNewJavaError(message: String?, e: Throwable) {
    showNewError(message, convertJavaStackTrace(e))
  }

  override fun showNewJSError(message: String?, details: ReadableArray?, errorCookie: Int) {
    showNewError(message, convertJsStackTrace(details))
  }

  private fun showNewError(message: String?, stack: Array<StackFrame>) {
    UiThreadUtil.runOnUiThread {
      lastErrorTitle = message
      lastErrorStack = stack

      if (redBoxSurfaceDelegate == null) {
        this.redBoxSurfaceDelegate =
          createSurfaceDelegate("RedBox")
            ?: ExpoLogBoxSurfaceDelegate(this@ExpoLogBoxDevSupportManager).apply {
              createContentView("RedBox")
            }
      }

      if (redBoxSurfaceDelegate?.isShowing() == true) {
        // Sometimes errors cause multiple errors to be thrown in JS in quick succession. Only
        // show the first and most actionable one.
        return@runOnUiThread
      }
      redBoxSurfaceDelegate?.show()
    }
  }
}

/**
 * [Source](https://github.com/krystofwoldrich/react-native/blob/7db31e2fca0f828aa6bf489ae6dc4adef9b7b7c3/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgelessDevSupportManager.kt#L29)
 *
 * An implementation of [DevSupportManager] that extends the functionality in
 * [DevSupportManagerBase] with some additional, more flexible APIs for asynchronously loading the
 * JS bundle.
 */
open class ExpoBridgelessDevSupportManager(
  applicationContext: Context,
  reactInstanceManagerHelper: ReactInstanceDevHelper,
  packagerPathForJSBundleName: String?,
  enableOnCreate: Boolean,
  redBoxHandler: RedBoxHandler?,
  devBundleDownloadListener: DevBundleDownloadListener?,
  minNumShakes: Int,
  customPackagerCommandHandlers: Map<String, RequestHandler>?,
  surfaceDelegateFactory: SurfaceDelegateFactory?,
  devLoadingViewManager: DevLoadingViewManager?,
  pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?
) :
  DevSupportManagerBase(
    applicationContext,
    reactInstanceManagerHelper,
    packagerPathForJSBundleName,
    enableOnCreate,
    redBoxHandler,
    devBundleDownloadListener,
    minNumShakes,
    customPackagerCommandHandlers,
    surfaceDelegateFactory,
    devLoadingViewManager,
    pausedInDebuggerOverlayManager
  ) {

  override val uniqueTag: String
    get() = "Bridgeless"

  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()
    // dismiss RedBox if it exists
    hideRedboxDialog()
    reactInstanceDevHelper.reload("BridgelessDevSupportManager.handleReloadJS()")
  }
}
