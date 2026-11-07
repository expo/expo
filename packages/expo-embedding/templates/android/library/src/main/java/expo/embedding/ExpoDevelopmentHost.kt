package expo.embedding

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.ReactHostImpl
import expo.modules.ExpoModulesPackage

// Expo's factory does not expose a dev-support factory parameter. Keep its module hooks when
// constructing the Debug host with a project-aware Metro availability check.
@OptIn(UnstableReactNativeAPI::class)
internal fun createAutomaticReactHost(context: Context, packages: List<ReactPackage>): ReactHost {
  val handlers = ExpoModulesPackage.packageList.flatMap { it.createReactNativeHostHandlers(context) }
  val useDevSupport = handlers.firstNotNullOfOrNull { it.useDeveloperSupport } ?: true
  val file = handlers.firstNotNullOfOrNull { it.getJSBundleFile(useDevSupport) }
  val asset = handlers.firstNotNullOfOrNull { it.getBundleAssetName(useDevSupport) } ?: "index.android.bundle"
  val loader = when {
    file == null -> JSBundleLoader.createAssetLoader(context, "assets://$asset", true)
    file.startsWith("assets://") -> JSBundleLoader.createAssetLoader(context, file, true)
    else -> JSBundleLoader.createFileLoader(file)
  }
  val delegate = DefaultReactHostDelegate(
    jsMainModulePath = ".expo/.virtual-metro-entry",
    jsBundleLoader = loader,
    reactPackages = packages,
    turboModuleManagerDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder(),
    exceptionHandler = { error ->
      if (handlers.isEmpty()) throw error
      handlers.forEach { it.onReactInstanceException(useDevSupport, error) }
    },
  )
  val components = ComponentFactory()
  DefaultComponentsRegistry.register(components)
  handlers.forEach { it.onWillCreateReactInstance(useDevSupport) }
  val host = ReactHostImpl(
    context = context,
    reactHostDelegate = delegate,
    componentFactory = components,
    allowPackagerServerAccess = true,
    useDevSupport = useDevSupport,
    devSupportManagerFactory = handlers.firstNotNullOfOrNull {
      it.devSupportManagerFactory as? DevSupportManagerFactory
    } ?: ExpoMetroDevSupportFactory(),
  )
  handlers.forEach {
    it.onDidCreateReactHost(context, host)
    it.onDidCreateDevSupportManager(host.devSupportManager)
  }
  host.addReactInstanceEventListener(object : ReactInstanceEventListener {
    override fun onReactContextInitialized(context: ReactContext) {
      handlers.forEach { it.onDidCreateReactInstance(useDevSupport, context) }
    }
  })
  return host
}
