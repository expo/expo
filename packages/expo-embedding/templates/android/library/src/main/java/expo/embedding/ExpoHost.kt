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
  bundleSource: BundleSource = BundleSource.Automatic,
) {
  enum class BundleSource { Automatic, Embedded, DevelopmentServer }
  private val developmentEnabled = BuildConfig.DEBUG &&
    application.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0

  init {
    require(bundleSource != BundleSource.DevelopmentServer || developmentEnabled) {
      "Metro is only available in debuggable applications. Use BundleSource.Embedded for release builds."
    }
    if (bundleSource != BundleSource.DevelopmentServer) {
      try {
        application.assets.open("index.android.bundle").close()
      } catch (cause: IOException) {
        throw IllegalStateException(
          "ExpoHost could not open the embedded asset index.android.bundle. Run npx expo-embedding init and rebuild the app with the generated JavaScript bundling task enabled.",
          cause,
        )
      }
    }
  }

  val reactHost: ReactHost = if (bundleSource == BundleSource.Automatic && developmentEnabled) {
    createAutomaticReactHost(application, packages)
  } else {
    ExpoReactHostFactory.getDefaultReactHost(
      context = application,
      packageList = packages,
      useDevSupport = bundleSource == BundleSource.DevelopmentServer,
    )
  }
}
