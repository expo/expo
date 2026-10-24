package expo.embedding

import android.app.Application
import android.content.res.Configuration
import androidx.annotation.MainThread
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import expo.modules.ApplicationLifecycleDispatcher

class ExpoApplicationDelegate(
  private val bundleSource: ExpoHost.BundleSource = ExpoHost.BundleSource.Embedded,
) : ReactApplication {
  private var application: Application? = null
  private var initializedHost: ExpoHost? = null

  val host: ExpoHost
    get() = checkNotNull(initializedHost) {
      "Expo is not initialized. Call expo.onCreate(this) from Application.onCreate() before accessing the host."
    }

  override val reactHost: ReactHost
    get() = host.reactHost

  @MainThread
  fun onCreate(application: Application) {
    this.application?.let { previous ->
      check(previous === application) {
        "This Expo delegate already belongs to another Application. Create one delegate per Application."
      }
      return
    }
    check(application is ReactApplication) {
      "The Application must expose its Expo host to native modules. Declare ReactApplication by expo on your Application class."
    }
    loadReactNative(application)
    initializedHost = ExpoHost(application, PackageList(application).packages, bundleSource)
    check(application.reactHost === reactHost) {
      "The Application exposes a different React host. Delegate ReactApplication to the same ExpoApplicationDelegate passed to onCreate()."
    }
    this.application = application
    ApplicationLifecycleDispatcher.onApplicationCreate(application)
  }

  @MainThread
  fun onConfigurationChanged(newConfig: Configuration) {
    val application = checkNotNull(application) {
      "Expo is not initialized. Call expo.onCreate(this) from Application.onCreate() before forwarding configuration changes."
    }
    ApplicationLifecycleDispatcher.onConfigurationChanged(application, newConfig)
  }
}
