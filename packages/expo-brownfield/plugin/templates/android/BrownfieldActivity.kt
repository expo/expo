package ${{packageId}}

import android.app.Activity
import android.app.Application
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.ReactPackage
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import expo.modules.ApplicationLifecycleDispatcher

object BrownfieldLifecycleDispatcher {
  fun onApplicationCreate(application: Application) {
    ApplicationLifecycleDispatcher.onApplicationCreate(application)
  }

  fun onConfigurationChanged(application: Application, newConfig: Configuration) {
    ApplicationLifecycleDispatcher.onConfigurationChanged(application, newConfig)
  }
}

// DefaultHardwareBackBtnHandler is declared here because ReactDelegate.onHostResume()
// hard-casts the host Activity to it — without the interface on the base class, every
// subclass would crash with ClassCastException on first resume.
open class BrownfieldActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    BrownfieldLifecycleDispatcher.onConfigurationChanged(this.application, newConfig)
  }

  open fun showReactNativeFragment(
    rootComponent: String = "main",
    additionalPackages: List<ReactPackage> = emptyList(),
  ) {
    (this as Activity).showReactNativeFragment(rootComponent, additionalPackages)
  }

  @Suppress("DEPRECATION")
  override fun invokeDefaultOnBackPressed() {
    super.onBackPressed()
  }
}
