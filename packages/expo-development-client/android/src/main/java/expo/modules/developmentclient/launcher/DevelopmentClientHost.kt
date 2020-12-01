package expo.modules.developmentclient.launcher

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.shell.MainReactPackage
import expo.modules.barcodescanner.BarCodeScannerPackage
import expo.modules.developmentclient.DevelopmentClientPackage
import expo.modules.developmentclient.R
import expo.modules.developmentclient.react.injectDebugServerHost
import org.apache.commons.io.IOUtils
import org.unimodules.adapters.react.ModuleRegistryAdapter
import org.unimodules.adapters.react.ReactModuleRegistryProvider
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class DevelopmentClientHost(
  application: Application,
  private val launcherIp: String?
) : ReactNativeHost(application) {

  init {
    if (useDeveloperSupport) {
      injectDebugServerHost(application.applicationContext, this, launcherIp!!)
    }
  }

  private val mModuleRegistryProvider = ReactModuleRegistryProvider(
    listOf(BarCodeScannerPackage())
  )

  override fun getUseDeveloperSupport() = launcherIp != null

  override fun getPackages() = listOf(
    MainReactPackage(null),
    DevelopmentClientPackage(),
    ModuleRegistryAdapter(mModuleRegistryProvider)
  )

  override fun getJSMainModuleName() = "index"

  override fun getJSBundleFile(): String? {
    if (useDeveloperSupport) {
      return null
    }
    // React Native needs an actual file path, while the embedded bundle is a 'raw resource' which
    // doesn't have a true file path. So we write it out to a temporary file then return a path
    // to that file.
    val bundle = File(application.cacheDir.absolutePath + "/expo_development_client_android.bundle")
    return try {
      // TODO(nikki): We could cache this? Biasing toward always using latest for now...
      val output = FileOutputStream(bundle)
      val input = application.resources.openRawResource(R.raw.expo_development_client_android)
      IOUtils.copy(input, output)
      output.close()
      bundle.absolutePath
    } catch (e: IOException) {
      null
    }
  }
}
