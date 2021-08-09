package host.exp.exponent

import android.os.Bundle
import com.facebook.react.ReactPackage
import expo.modules.core.interfaces.Package
import host.exp.exponent.experience.DetachActivity
import host.exp.exponent.generated.DetachBuildConstants

class MainActivity : DetachActivity() {
  override fun publishedUrl(): String {
    return "TEMPLATE_INITIAL_URL"
  }

  override fun developmentUrl(): String {
    return DetachBuildConstants.DEVELOPMENT_URL
  }

  override fun reactPackages(): List<ReactPackage>? {
    return (application as MainApplication).packages
  }

  override fun expoPackages(): List<Package>? {
    return (application as MainApplication).expoPackages
  }

  override val isDebug = BuildConfig.DEBUG

  override fun initialProps(expBundle: Bundle?): Bundle? {
    // Add extra initialProps here
    return expBundle
  }
}
