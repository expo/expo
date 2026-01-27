// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import expo.modules.core.interfaces.ReactNativeHostHandler
import java.lang.ref.WeakReference

object ExpoReactHostFactory {
  private var reactHost: ReactHost? = null

  @UnstableReactNativeAPI
  private class ExpoReactHostDelegate(
    private val weakContext: WeakReference<Context>,
    private val packageList: List<ReactPackage>,
    override val jsMainModulePath: String,
    private val jsBundleAssetPath: String?,
    private val jsBundleFilePath: String? = null,
    private val useDevSupport: Boolean,
    override val bindingsInstaller: BindingsInstaller? = null,
    override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder =
      DefaultTurboModuleManagerDelegate.Builder(),
    private val hostHandlers: List<ReactNativeHostHandler>
  ) : ReactHostDelegate {

    val hostDelegateJsBundleFilePath: String?
      get() =
        hostHandlers.asSequence()
          .mapNotNull { it.getJSBundleFile(useDevSupport) }
          .firstOrNull() ?: jsBundleFilePath

    val hostDelegateJSBundleAssetPath: String?
      get() =
        hostHandlers.asSequence()
          .mapNotNull { it.getBundleAssetName(useDevSupport) }
          .firstOrNull() ?: jsBundleAssetPath

    val hostDelegateUseDeveloperSupport: Boolean
      get() =
        hostHandlers.asSequence()
          .mapNotNull { it.useDeveloperSupport }
          .firstOrNull() ?: useDevSupport

    // Keeps this `_jsBundleLoader` backing property for DevLauncher to replace its internal value
    private var _jsBundleLoader: JSBundleLoader? = null
    override val jsBundleLoader: JSBundleLoader
      get() {
        val backingJSBundleLoader = _jsBundleLoader
        if (backingJSBundleLoader != null) {
          return backingJSBundleLoader
        }
        val context = weakContext.get()
          ?: throw IllegalStateException("Unable to get concrete Context")
        hostDelegateJsBundleFilePath?.let { jsBundleFile ->
          if (jsBundleFile.startsWith("assets://")) {
            return JSBundleLoader.createAssetLoader(context, jsBundleFile, true)
          }
          return JSBundleLoader.createFileLoader(jsBundleFile)
        }

        return JSBundleLoader.createAssetLoader(context, "assets://$hostDelegateJSBundleAssetPath", true)
      }

    override val jsRuntimeFactory: JSRuntimeFactory
      get() = HermesInstance()

    override val reactPackages: List<ReactPackage>
      get() = packageList

    override fun handleInstanceException(error: Exception) {
      if (hostHandlers.isEmpty()) {
        throw error
      }
      hostHandlers.forEach { handler ->
        handler.onReactInstanceException(hostDelegateUseDeveloperSupport, error)
      }
    }
  }

  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  fun getDefaultReactHost(
    context: Context,
    packageList: List<ReactPackage>,
    jsMainModulePath: String = ".expo/.virtual-metro-entry",
    jsBundleAssetPath: String = "index.android.bundle",
    jsBundleFilePath: String? = null,
    jsRuntimeFactory: JSRuntimeFactory? = null,
    useDevSupport: Boolean = ReactBuildConfig.DEBUG,
    bindingsInstaller: BindingsInstaller? = null
  ): ReactHost {
    if (reactHost == null) {
      val hostHandlers = ExpoModulesPackage.packageList
        .flatMap { it.createReactNativeHostHandlers(context) }

      val reactHostDelegate = ExpoReactHostDelegate(
        WeakReference(context),
        packageList,
        jsMainModulePath,
        jsBundleAssetPath,
        jsBundleFilePath,
        useDevSupport,
        bindingsInstaller,
        hostHandlers = hostHandlers
      )
      val componentFactory = ComponentFactory()
      DefaultComponentsRegistry.register(componentFactory)

      hostHandlers.forEach { handler ->
        handler.onWillCreateReactInstance(useDevSupport)
      }

      val reactHostImpl =
        ReactHostImpl(
          context,
          delegate = reactHostDelegate,
          componentFactory = componentFactory,
          allowPackagerServerAccess = true,
          useDevSupport = useDevSupport
        )

      hostHandlers.forEach { handler ->
        handler.onDidCreateReactHost(context, reactHostImpl)
        handler.onDidCreateDevSupportManager(reactHostImpl.devSupportManager)
      }

      reactHostImpl.addReactInstanceEventListener(object : ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
          hostHandlers.forEach { handler ->
            handler.onDidCreateReactInstance(useDevSupport, context)
          }
        }
      })

      reactHost = reactHostImpl
    }
    return reactHost as ReactHost
  }
}
