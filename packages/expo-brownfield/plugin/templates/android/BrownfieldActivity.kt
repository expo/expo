package ${{packageId}}

import android.app.Application
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import expo.modules.ApplicationLifecycleDispatcher

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
}
