package abi43_0_0.expo.modules.core.interfaces

import android.app.Application
import android.content.res.Configuration

interface ApplicationLifecycleListener {
  fun onCreate(application: Application) {}
  fun onConfigurationChanged(newConfig: Configuration) {}
}
