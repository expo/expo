package host.exp.exponent.factories

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.devsupport.BridgeDevSupportManager
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.packagerconnection.RequestHandler
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.BridgelessDevSupportManager
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import com.facebook.react.runtime.internal.bolts.Task
import expo.modules.ReactNativeHostWrapper
import versioned.host.exp.exponent.VersionedUtils
import java.lang.ref.WeakReference
import java.util.concurrent.Executors

object ReactHostFactory {

  @UnstableReactNativeAPI
  private class ExpoReactHostDelegate(
    private val weakContext: WeakReference<Context>,
    private val reactNativeHostWrapper: ReactNativeHostWrapper,
    override val bindingsInstaller: BindingsInstaller? = null,
    private val reactNativeConfig: ReactNativeConfig = ReactNativeConfig.DEFAULT_CONFIG,
    override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder =
      DefaultTurboModuleManagerDelegate.Builder()
  ) : ReactHostDelegate {

    // Keeps this `_jsBundleLoader` backing property for DevLauncher to replace its internal value
    override val jsBundleLoader: JSBundleLoader
      get() {
        val context =
          weakContext.get() ?: throw IllegalStateException("Unable to get concrete Context")
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
      get() = HermesInstance()

    override val reactPackages: List<ReactPackage>
      get() = reactNativeHostWrapper.packages

    override fun getReactNativeConfig(): ReactNativeConfig = reactNativeConfig

    override fun handleInstanceException(error: Exception) {
      val useDeveloperSupport = reactNativeHostWrapper.useDeveloperSupport
      reactNativeHostWrapper.reactNativeHostHandlers.forEach { handler ->
        handler.onReactInstanceException(useDeveloperSupport, error)
      }
    }
  }

  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  fun createFromReactNativeHost(
    context: Context,
    reactNativeHost: ReactNativeHost,
    devBundleDownloadListener: DevBundleDownloadListener? = null
  ): ReactHostImpl {
    require(reactNativeHost is ReactNativeHostWrapper) {
      "You can call createFromReactNativeHost only with instances of ReactNativeHostWrapper"
    }
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
        Executors.newSingleThreadExecutor(),
        Task.UI_THREAD_EXECUTOR,
        true,
        useDeveloperSupport,
        ExpoGoDevSupportFactory(devBundleDownloadListener),
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

    return reactHostImpl
  }
}
