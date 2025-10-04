/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package expo.modules

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
import expo.modules.logbox.ExpoLogBoxSurfaceDelegate

/**
 * An implementation of [DevSupportManager] that extends the functionality in
 * [DevSupportManagerBase] with some additional, more flexible APIs for asynchronously loading the
 * JS bundle.
 *
 * @constructor The primary constructor mirrors the same constructor we have for
 *   [BridgeDevSupportManager] and
 *     * is kept for backward compatibility.
 */
internal open class ExpoBridgelessDevSupportManager(
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
        pausedInDebuggerOverlayManager) {

    override val uniqueTag: String
        get() = "Bridgeless"

    override fun handleReloadJS() {
        UiThreadUtil.assertOnUiThread()
        // dismiss redbox if exists
        hideRedboxDialog()
        reactInstanceDevHelper.reload("BridgelessDevSupportManager.handleReloadJS()")
    }
}

internal class ExpoDevSupportManagerWithLogBoxOverride(
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
        pausedInDebuggerOverlayManager) {

    private var redBoxSurfaceDelegate: SurfaceDelegate? = null

    override fun hideRedboxDialog() {
        redBoxSurfaceDelegate?.hide()
    }

    override fun showNewJavaError(message: String?, e: Throwable) {
        showNewError(message)
    }

    override fun showNewJSError(message: String?, details: ReadableArray?, errorCookie: Int) {
        showNewError(message)
    }

    private fun showNewError(message: String?) {
        UiThreadUtil.runOnUiThread {
            // NOTE(@krystofwoldrich): Should we keep also other context of the error?
            lastErrorTitle = message

            if (redBoxSurfaceDelegate == null) {
                this.redBoxSurfaceDelegate =
                    createSurfaceDelegate("RedBox")
                        ?: ExpoLogBoxSurfaceDelegate(this@ExpoDevSupportManagerWithLogBoxOverride).apply {
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
