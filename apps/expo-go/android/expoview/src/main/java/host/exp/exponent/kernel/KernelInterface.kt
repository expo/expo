// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import de.greenrobot.event.EventBus
import host.exp.exponent.ExpoUpdatesAppLoader
import host.exp.exponent.kernel.KernelConstants.AddedExperienceEventEvent
import host.exp.exponent.kernel.KernelConstants.ExperienceOptions

abstract class KernelInterface {
  abstract fun handleError(errorMessage: String)
  abstract fun handleError(exception: Exception)
  abstract fun openExperience(options: ExperienceOptions)
  abstract fun reloadVisibleExperience(manifestUrl: String, forceCache: Boolean): Boolean
  abstract fun getAppLoaderForManifestUrl(manifestUrl: String?): ExpoUpdatesAppLoader?

  fun reloadVisibleExperience(manifestUrl: String): Boolean {
    return reloadVisibleExperience(manifestUrl, false)
  }

  fun addEventForExperience(manifestUrl: String, event: KernelConstants.ExperienceEvent) {
    if (!manifestUrlToEvents.containsKey(manifestUrl)) {
      manifestUrlToEvents[manifestUrl] =
        mutableSetOf()
    }
    manifestUrlToEvents[manifestUrl]!!.add(event)
    EventBus.getDefault().post(AddedExperienceEventEvent(manifestUrl))
  }

  fun consumeExperienceEvents(manifestUrl: String): Set<KernelConstants.ExperienceEvent> {
    val result: Set<KernelConstants.ExperienceEvent>
    if (manifestUrlToEvents.containsKey(manifestUrl)) {
      result = manifestUrlToEvents[manifestUrl]!!
      manifestUrlToEvents.remove(manifestUrl)
    } else {
      result = mutableSetOf()
    }
    return result
  }

  companion object {
    private val manifestUrlToEvents = mutableMapOf<String, MutableSet<KernelConstants.ExperienceEvent>>()
  }
}
