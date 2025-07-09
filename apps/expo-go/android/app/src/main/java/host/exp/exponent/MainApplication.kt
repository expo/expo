package host.exp.exponent

import com.facebook.react.ReactPackage
import expo.modules.ExpoModulesPackageList
import expo.modules.apploader.AppLoaderPackagesProviderInterface
import expo.modules.core.interfaces.Package

// Needed for `react-native link`
// import com.facebook.react.ReactApplication;
class MainApplication : ExpoApplication(), AppLoaderPackagesProviderInterface<ReactPackage?> {
  override val isDebug: Boolean
    get() = BuildConfig.DEBUG

  // Needed for `react-native link`
  override fun getPackages(): List<ReactPackage> {
    return mutableListOf()
  }

  override fun getExpoPackages(): List<Package> {
    return ExpoModulesPackageList.getPackageList()
  }
}
