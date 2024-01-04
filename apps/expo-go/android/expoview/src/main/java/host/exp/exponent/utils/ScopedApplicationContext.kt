// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.app.Application
import android.content.ComponentCallbacks
import android.content.res.Configuration

class ScopedApplicationContext(private val application: Application, context: ScopedContext) : Application() {
  override fun onCreate() {
    application.onCreate()
  }

  override fun onTerminate() {
    application.onTerminate()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    application.onConfigurationChanged(newConfig)
  }

  override fun onLowMemory() {
    application.onLowMemory()
  }

  override fun onTrimMemory(level: Int) {
    application.onTrimMemory(level)
  }

  override fun registerComponentCallbacks(callback: ComponentCallbacks) {
    application.registerComponentCallbacks(callback)
  }

  override fun unregisterComponentCallbacks(callback: ComponentCallbacks) {
    application.unregisterComponentCallbacks(callback)
  }

  override fun registerActivityLifecycleCallbacks(callback: ActivityLifecycleCallbacks) {
    application.registerActivityLifecycleCallbacks(callback)
  }

  override fun unregisterActivityLifecycleCallbacks(callback: ActivityLifecycleCallbacks) {
    application.unregisterActivityLifecycleCallbacks(callback)
  }

  override fun registerOnProvideAssistDataListener(callback: OnProvideAssistDataListener) {
    application.registerOnProvideAssistDataListener(callback)
  }

  override fun unregisterOnProvideAssistDataListener(callback: OnProvideAssistDataListener) {
    application.unregisterOnProvideAssistDataListener(callback)
  }

  init {
    attachBaseContext(context)
  }
}
