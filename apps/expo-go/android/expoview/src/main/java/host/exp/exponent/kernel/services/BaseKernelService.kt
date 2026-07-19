// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services

import android.content.Context
import de.greenrobot.event.EventBus
import host.exp.exponent.experience.BaseExperienceActivity.ExperienceBackgroundedEvent
import host.exp.exponent.experience.BaseExperienceActivity.ExperienceForegroundedEvent
import host.exp.exponent.kernel.ExperienceKey

abstract class BaseKernelService(protected val context: Context) {
  protected var currentExperienceKey: ExperienceKey? = null
    private set

  abstract fun onExperienceForegrounded(experienceKey: ExperienceKey)
  abstract fun onExperienceBackgrounded(experienceKey: ExperienceKey)

  fun onEvent(event: ExperienceBackgroundedEvent) {
    currentExperienceKey = null
    onExperienceBackgrounded(event.experienceKey)
  }

  fun onEvent(event: ExperienceForegroundedEvent) {
    currentExperienceKey = event.experienceKey
    onExperienceForegrounded(event.experienceKey)
  }

  init {
    EventBus.getDefault().register(this)
  }
}
