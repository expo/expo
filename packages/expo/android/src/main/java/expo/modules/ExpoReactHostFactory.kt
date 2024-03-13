// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules

import android.content.Context
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance

object ExpoReactHostFactory {
  private var reactHost: ReactHost? = null

  internal data class CreateParams(
    val packageList: List<ReactPackage>,
    val jsMainModulePath: String = "index",
    val jsBundleAssetPath: String = "index",
    val isHermesEnabled: Boolean = true,
  )

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
      val reactNativeHostHandlers = reactNativeHost.reactNativeHostHandlers
      reactNativeHostHandlers.forEach { handler ->
        handler.onWillCreateReactInstance(useDeveloperSupport)
      }

      val createParams = reactNativeHost.getReactHostFactoryCreateParams()
      val jsBundleLoader =
        JSBundleLoader.createAssetLoader(context, "assets://${createParams.jsBundleAssetPath}", true)
      val jsRuntimeFactory = if (createParams.isHermesEnabled) HermesInstance() else JSCInstance()
      val defaultReactHostDelegate =
        DefaultReactHostDelegate(
          jsMainModulePath = createParams.jsMainModulePath,
          jsBundleLoader = jsBundleLoader,
          reactPackages = createParams.packageList,
          jsRuntimeFactory = jsRuntimeFactory,
          turboModuleManagerDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder())
      val reactJsExceptionHandler = ReactJsExceptionHandler { _ -> }
      val componentFactory = ComponentFactory()
      DefaultComponentsRegistry.register(componentFactory)

      reactHost =
        ReactHostImpl(
          context,
          defaultReactHostDelegate,
          componentFactory,
          true,
          reactJsExceptionHandler,
          useDeveloperSupport)
          .apply {
            jsEngineResolutionAlgorithm =
              if (createParams.isHermesEnabled) {
                JSEngineResolutionAlgorithm.HERMES
              } else {
                JSEngineResolutionAlgorithm.JSC
              }
          }

      reactNativeHostHandlers.forEach { handler ->
        handler.onDidCreateReactInstance(useDeveloperSupport, null, reactHost)
      }
    }
    return reactHost as ReactHost
  }
}
