package ${{packageId}}

import android.app.Activity
import android.app.Application
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import expo.modules.ApplicationLifecycleDispatcher

object BrownfieldLifecycleDispatcher {
  @JvmStatic
  fun onApplicationCreate(application: Application) {
    ApplicationLifecycleDispatcher.onApplicationCreate(application)
  }

  @JvmStatic
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

  open fun showReactNativeFragment(rootComponent: String = "main") {
    (this as Activity).showReactNativeFragment(rootComponent)
  }

  // React Native calls this when JS has no back handler. Don't call
  // super.onBackPressed() here: it re-dispatches through the
  // OnBackPressedDispatcher, whose RN callback (setUpNativeBackHandling)
  // forwards back to JS — an infinite native <-> JS ping-pong that makes the
  // back button dead. Finishing the activity is the default back action for a
  // brownfield React Native screen: it returns to the previous host screen.
  override fun invokeDefaultOnBackPressed() {
    finish()
  }
}
