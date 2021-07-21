// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.RegistryLifecycleListener
import org.unimodules.core.interfaces.services.UIManager

/* package */
internal abstract class BaseService     /* package */(protected val context: Context) : LifecycleEventListener, RegistryLifecycleListener {
  private var mModuleRegistry: ModuleRegistry? = null
  var experienceIsForegrounded = false
    private set

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry

    // Register to new UIManager
    if (mModuleRegistry != null && mModuleRegistry!!.getModule(UIManager::class.java) != null) {
      mModuleRegistry!!.getModule(UIManager::class.java).registerLifecycleEventListener(this)
    }
  }

  override fun onDestroy() {
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry!!.getModule(UIManager::class.java) != null) {
      mModuleRegistry!!.getModule(UIManager::class.java).unregisterLifecycleEventListener(this)
    }
  }

  override fun onHostResume() {
    experienceIsForegrounded = true
    onExperienceForegrounded()
  }

  override fun onHostDestroy() {
    // do nothing
  }

  override fun onHostPause() {
    experienceIsForegrounded = false
    onExperienceBackgrounded()
  }

  abstract fun onExperienceForegrounded()
  abstract fun onExperienceBackgrounded()
}