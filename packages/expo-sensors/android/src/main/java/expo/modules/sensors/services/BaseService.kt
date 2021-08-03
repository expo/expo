// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.RegistryLifecycleListener
import expo.modules.core.interfaces.services.UIManager

/* internal */
abstract class BaseService(protected val context: Context) : LifecycleEventListener, RegistryLifecycleListener {
  private lateinit var mModuleRegistry: ModuleRegistry
  var experienceIsForegrounded = false
    private set

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry

    // Register to new UIManager
    mModuleRegistry.getModule(UIManager::class.java)?.registerLifecycleEventListener(this)
  }

  override fun onDestroy() {
    // Unregister from old UIManager
    if (this::mModuleRegistry.isInitialized) {
      mModuleRegistry.getModule(UIManager::class.java)?.unregisterLifecycleEventListener(this)
    }
  }

  override fun onHostResume() {
    experienceIsForegrounded = true
    onExperienceForegrounded()
  }

  override fun onHostDestroy() = Unit

  override fun onHostPause() {
    experienceIsForegrounded = false
    onExperienceBackgrounded()
  }

  abstract fun onExperienceForegrounded()
  abstract fun onExperienceBackgrounded()
}
