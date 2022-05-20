package expo.modules

import android.app.Application
import android.content.Context
import androidx.test.runner.AndroidJUnitRunner
import com.facebook.soloader.SoLoader
import expo.modules.kotlin.jni.JSIInteropModuleRegistry

/**
 * A simple test runner that ensures all needed libraries will be loaded before starting any tests.
 */
class TestRunner : AndroidJUnitRunner() {
  override fun newApplication(cl: ClassLoader?, className: String?, context: Context?): Application {
    // Loads libs like hermes
    SoLoader.init(context,  /* native exopackage */false)
    // Using `JSIInteropModuleRegistry.Companion` ensures that static libs will be loaded.
    JSIInteropModuleRegistry.Companion

    return super.newApplication(cl, className, context)
  }
}
