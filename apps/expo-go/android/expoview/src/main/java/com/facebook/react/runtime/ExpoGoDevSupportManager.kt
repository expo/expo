/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.runtime

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.View
import com.facebook.infer.annotation.Nullsafe
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaJSExecutor
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.runtime.internal.bolts.Task
import versioned.host.exp.exponent.VersionedUtils
import java.lang.ref.WeakReference

@Nullsafe(Nullsafe.Mode.LOCAL)
class ExpoGoDevSupportManager(
  private val reactHost: ReactHostImpl,
  context: Context,
  packagerPathForJSBundleName: String?,
  devBundleDownloadListener: DevBundleDownloadListener?
) :
  DevSupportManagerBase(
    context.applicationContext,
    createInstanceDevHelper(reactHost),
    packagerPathForJSBundleName,
    true,
    null,
    devBundleDownloadListener,
    100,
    VersionedUtils.createPackagerCommandHelpers(),
    null,
    null,
    null
  ) {
  @Suppress("INAPPLICABLE_JVM_NAME")
  @JvmName("jSBundleURLForRemoteDebugging")
  override fun getJSBundleURLForRemoteDebugging(): String {
    return super.getJSBundleURLForRemoteDebugging()
  }

  override fun getUniqueTag(): String {
    return "Bridgeless-ExpoGo"
  }

  override fun loadSplitBundleFromServer(
    bundlePath: String,
    callback: DevSplitBundleCallback
  ) {
    fetchSplitBundleAndCreateBundleLoader(
      bundlePath,
      object : CallbackWithBundleLoader {
        override fun onSuccess(bundleLoader: JSBundleLoader) {
          reactHost
            .loadBundle(bundleLoader)
            .onSuccess { task: Task<Boolean> ->
              if (task.getResult() == java.lang.Boolean.TRUE) {
                val bundleURL =
                  devServerHelper.getDevServerSplitBundleURL(bundlePath)
                val reactContext = reactHost.currentReactContext
                reactContext?.getJSModule(HMRClient::class.java)?.registerBundle(bundleURL)
                callback.onSuccess()
              }
              null
            }
        }

        override fun onError(url: String, cause: Throwable) {
          callback.onError(url, cause)
        }
      }
    )
  }

  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()

    // dismiss redbox if exists
    hideRedboxDialog()
    reactHost.reload("BridgelessDevSupportManager.handleReloadJS()")
  }

  companion object {
    private fun createInstanceDevHelper(reactHost: ReactHostImpl): ReactInstanceDevHelper {
      return object : ReactInstanceDevHelper {
        private var logBoxSurface = WeakReference<ReactSurfaceImpl?>(null)

        override fun onReloadWithJSDebugger(proxyExecutorFactory: JavaJSExecutor.Factory) {
          // Not implemented
        }

        override fun onJSBundleLoadedFromServer() {
          // Not implemented
        }

        override fun toggleElementInspector() {
          val reactContext = reactHost.currentReactContext
          reactContext?.getJSModule(
            DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
          )
            ?.emit("toggleElementInspector", null)
        }

        override fun getCurrentActivity(): Activity? {
          return reactHost.lastUsedActivity
        }

        override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory {
          throw IllegalStateException("Not implemented for bridgeless mode")
        }

        override fun createRootView(appKey: String): View? {
          val currentActivity = currentActivity
          if (currentActivity != null && !reactHost.isSurfaceWithModuleNameAttached(appKey)) {
            val reactSurface =
              ReactSurfaceImpl.createWithView(currentActivity, appKey, Bundle())

            if (appKey == "LogBox") {
              logBoxSurface = WeakReference(reactSurface)
            }

            reactSurface.attach(reactHost)
            reactSurface.start()

            return reactSurface.view
          }
          return null
        }

        override fun destroyRootView(rootView: View) {
          // The log box surface is a special case and needs to be detached from the host.
          // The detachment process should be handled by React Native, but it appears to be malfunctioning.
          // This is a temporary solution and should be removed
          // once we identify the root cause of the surface remaining attached after reloads.
          val logBox = logBoxSurface.get()
          if (logBox != null) {
            reactHost.detachSurface(logBox)
            logBoxSurface.clear()
          }
        }
      }
    }
  }
}
