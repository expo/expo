package host.exp.exponent.factories

import android.content.Context
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import com.facebook.react.runtime.internal.bolts.Task
import expo.modules.ExpoModulesPackage
import expo.modules.core.interfaces.ReactNativeHostHandler
import java.lang.ref.WeakReference
import java.util.concurrent.Executors

object ReactHostFactory {

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

    // Keeps this `_jsBundleLoader` backing property for DevLauncher to replace its internal value
    override val jsBundleLoader: JSBundleLoader
      get() {
        val context =
          weakContext.get() ?: throw IllegalStateException("Unable to get concrete Context")
        jsBundleFilePath?.let { jsBundleFile ->
          if (jsBundleFile.startsWith("assets://")) {
            return JSBundleLoader.createAssetLoader(context, jsBundleFile, true)
          }
          return JSBundleLoader.createFileLoader(jsBundleFile)
        }

        return JSBundleLoader.createAssetLoader(context, "assets://$jsBundleAssetPath", true)
      }

    override val jsRuntimeFactory: JSRuntimeFactory
      get() = HermesInstance()

    override val reactPackages: List<ReactPackage>
      get() = packageList

    override fun handleInstanceException(error: Exception) {
      hostHandlers.forEach { handler ->
        handler.onReactInstanceException(useDevSupport, error)
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
    bindingsInstaller: BindingsInstaller? = null,
    devBundleDownloadListener: DevBundleDownloadListener? = null
  ): ReactHostImpl {
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
        reactHostDelegate,
        componentFactory,
        Executors.newSingleThreadExecutor(),
        Task.UI_THREAD_EXECUTOR,
        true,
        useDevSupport,
        ExpoGoDevSupportFactory(devBundleDownloadListener)
      )

    hostHandlers.forEach { handler ->
      handler.onDidCreateDevSupportManager(reactHostImpl.devSupportManager)
    }

    reactHostImpl.addReactInstanceEventListener(object : ReactInstanceEventListener {
      override fun onReactContextInitialized(context: ReactContext) {
        hostHandlers.forEach { handler ->
          handler.onDidCreateReactInstance(useDevSupport, context)
        }
      }
    })

    return reactHostImpl
  }
}
