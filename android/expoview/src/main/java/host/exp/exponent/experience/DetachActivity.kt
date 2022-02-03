// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.experience

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactPackage
import com.facebook.react.ReactRootView
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.SingletonModule
import expo.modules.splashscreen.singletons.SplashScreen
import host.exp.exponent.Constants
import host.exp.expoview.ExpoViewBuildConfig
import versioned.host.exp.exponent.ExponentPackageDelegate
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter

abstract class DetachActivity : ExperienceActivity(), ExponentPackageDelegate {
  // Override me!
  abstract fun publishedUrl(): String?
  abstract fun developmentUrl(): String?
  abstract override fun reactPackages(): List<ReactPackage>?
  abstract override fun expoPackages(): List<Package>?
  abstract val isDebug: Boolean

  override fun onCreate(savedInstanceState: Bundle?) {
    ExpoViewBuildConfig.DEBUG = isDebug
    Constants.INITIAL_URL = if (isDebug) developmentUrl() else publishedUrl()
    manifestUrl = Constants.INITIAL_URL

    if (intent.data != null) {
      intentUri = intent.data.toString()
    }

    super.onCreate(savedInstanceState)

    SplashScreen.show(this, Constants.SPLASH_SCREEN_IMAGE_RESIZE_MODE, ReactRootView::class.java, true)

    kernel.handleIntent(this, intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    kernel.handleIntent(this, intent)
  }

  // TODO: eric: make Constants.INITIAL_URI reliable so we can get rid of this
  override fun shouldCheckOptions() {
    if (manifestUrl != null && kernel.hasOptionsForManifestUrl(manifestUrl)) {
      handleOptions(kernel.popOptionsForManifestUrl(manifestUrl)!!)
    } else if (isDebug && kernel.hasOptionsForManifestUrl(publishedUrl())) {
      // also check publishedUrl since this can get set before Constants.INITIAL_URL is set to developmentUrl
      handleOptions(kernel.popOptionsForManifestUrl(publishedUrl())!!)
    }
  }

  override val exponentPackageDelegate: ExponentPackageDelegate
    get() = this

  override fun getScopedModuleRegistryAdapterForPackages(
    packages: List<Package>,
    singletonModules: List<SingletonModule>
  ): ExpoModuleRegistryAdapter {
    return DetachedModuleRegistryAdapter(ReactModuleRegistryProvider(packages, singletonModules))
  }
}
