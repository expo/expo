package expo.embedding

import android.app.Application
import android.content.pm.ApplicationInfo
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import expo.modules.ExpoReactHostFactory
import java.io.IOException

class ExpoHost(
  application: Application,
  packages: List<ReactPackage>,
  bundleSource: BundleSource = BundleSource.Embedded,
) {
  enum class BundleSource { Embedded, DevelopmentServer }

  init {
    require(bundleSource == BundleSource.Embedded || application.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
      "Metro is only available in debuggable applications. Use BundleSource.Embedded for release builds."
    }
    if (bundleSource == BundleSource.Embedded) {
      try {
        application.assets.open("index.android.bundle").close()
      } catch (cause: IOException) {
        throw IllegalStateException(
          "ExpoHost could not open the embedded asset index.android.bundle. Run expo-embedding init and rebuild the app with the generated JavaScript bundling task enabled.",
          cause,
        )
      }
    }
  }

  val reactHost: ReactHost = ExpoReactHostFactory.getDefaultReactHost(
    context = application,
    packageList = packages,
    useDevSupport = bundleSource == BundleSource.DevelopmentServer,
  )
}
