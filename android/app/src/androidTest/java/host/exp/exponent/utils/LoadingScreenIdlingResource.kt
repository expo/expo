// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import androidx.test.espresso.IdlingResource
import de.greenrobot.event.EventBus
import host.exp.exponent.experience.ReactNativeActivity.ExperienceDoneLoadingEvent
import host.exp.exponent.experience.BaseExperienceActivity

class LoadingScreenIdlingResource : IdlingResource {
  private var resourceCallback: IdlingResource.ResourceCallback? = null

  fun onEvent(event: ExperienceDoneLoadingEvent?) {
    resourceCallback?.onTransitionToIdle()
  }

  override fun getName(): String {
    return LoadingScreenIdlingResource::class.java.name
  }

  override fun isIdleNow(): Boolean {
    if (BaseExperienceActivity.visibleActivity == null) {
      return false
    }
    val isIdle = !BaseExperienceActivity.visibleActivity!!.isLoading
    if (isIdle) {
      resourceCallback?.onTransitionToIdle()
    }
    return isIdle
  }

  override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback) {
    resourceCallback = callback
  }

  init {
    EventBus.getDefault().register(this)
  }
}
