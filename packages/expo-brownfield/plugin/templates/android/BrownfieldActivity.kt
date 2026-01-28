package ${{packageId}}

import android.app.Application
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import expo.modules.ApplicationLifecycleDispatcher
import android.view.KeyEvent

object BrownfieldLifecycleDispatcher {
  fun onApplicationCreate(application: Application) {
    ApplicationLifecycleDispatcher.onApplicationCreate(application)
  }

  fun onConfigurationChanged(application: Application, newConfig: Configuration) {
    ApplicationLifecycleDispatcher.onConfigurationChanged(application, newConfig)
  }
}

open class BrownfieldActivity : AppCompatActivity() {
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    BrownfieldLifecycleDispatcher.onConfigurationChanged(this.application, newConfig)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (BuildConfig.DEBUG) {
      try {
        val fragmentDelegate = expo.modules.devmenu.api.DevMenuApi.fragment { this }
        val fragment = fragmentDelegate.value
        if (fragment?.onKeyUp(keyCode, event) == true) {
          return true
        }
      } catch (e: NoClassDefFoundError) {
        // Dev menu not available
      }
    }

    return super.onKeyUp(keyCode, event)
  }
}
