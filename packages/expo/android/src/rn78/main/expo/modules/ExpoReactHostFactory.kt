// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules

import android.content.Context
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import java.lang.ref.WeakReference

object ExpoReactHostFactory {
  private var reactHost: ReactHost? = null

  @UnstableReactNativeAPI
  private class ExpoReactHostDelegate(
    private val weakContext: WeakReference<Context>,
    private val reactNativeHostWrapper: ReactNativeHostWrapper,
    override val bindingsInstaller: BindingsInstaller? = null,
    override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder =
      DefaultTurboModuleManagerDelegate.Builder()
  ) : ReactHostDelegate {

    // Keeps this `_jsBundleLoader` backing property for DevLauncher to replace its internal value
    private var _jsBundleLoader: JSBundleLoader? = null
    override val jsBundleLoader: JSBundleLoader
      get() {
        val backingJSBundleLoader = _jsBundleLoader
        if (backingJSBundleLoader != null) {
          return backingJSBundleLoader
        }
        val context = weakContext.get() ?: throw IllegalStateException("Unable to get concrete Context")
        reactNativeHostWrapper.jsBundleFile?.let { jsBundleFile ->
          if (jsBundleFile.startsWith("assets://")) {
            return JSBundleLoader.createAssetLoader(context, jsBundleFile, true)
          }
          return JSBundleLoader.createFileLoader(jsBundleFile)
        }
        val jsBundleAssetPath = reactNativeHostWrapper.bundleAssetName
        return JSBundleLoader.createAssetLoader(context, "assets://$jsBundleAssetPath", true)
      }

    override val jsMainModulePath: String
      get() = reactNativeHostWrapper.jsMainModuleName

    override val jsRuntimeFactory: JSRuntimeFactory
      get() = if (reactNativeHostWrapper.jsEngineResolutionAlgorithm == JSEngineResolutionAlgorithm.HERMES) {
        HermesInstance()
      } else {
        JSCInstance()
      }

    override val reactPackages: List<ReactPackage>
      get() = reactNativeHostWrapper.packages

    override fun handleInstanceException(error: Exception) {
      val handlers = reactNativeHostWrapper.reactNativeHostHandlers
      if (handlers.isEmpty()) {
        throw error
      }
      val useDeveloperSupport = reactNativeHostWrapper.useDeveloperSupport
      handlers.forEach { handler ->
        handler.onReactInstanceException(useDeveloperSupport, error)
      }
    }
  }

  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  fun createFromReactNativeHost(
    context: Context,
    reactNativeHost: ReactNativeHost
  ): ReactHost {
    require(reactNativeHost is ReactNativeHostWrapper) {
      "You can call createFromReactNativeHost only with instances of ReactNativeHostWrapper"
    }
    if (reactHost == null) {
      val useDeveloperSupport = reactNativeHost.useDeveloperSupport
      val reactHostDelegate = ExpoReactHostDelegate(WeakReference(context), reactNativeHost)
      val componentFactory = ComponentFactory()
      DefaultComponentsRegistry.register(componentFactory)

      reactNativeHost.reactNativeHostHandlers.forEach { handler ->
        handler.onWillCreateReactInstance(useDeveloperSupport)
      }

      val reactHostImpl =
        ReactHostImpl(
          context,
          reactHostDelegate,
          componentFactory,
          true,
          useDeveloperSupport
        )

      reactNativeHost.reactNativeHostHandlers.forEach { handler ->
        handler.onDidCreateDevSupportManager(reactHostImpl.devSupportManager)
      }

      reactHostImpl.addReactInstanceEventListener(object : ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
          reactNativeHost.reactNativeHostHandlers.forEach { handler ->
            handler.onDidCreateReactInstance(useDeveloperSupport, context)
          }
        }
      })

      reactHost = reactHostImpl
    }
    return reactHost as ReactHost
  }
}
