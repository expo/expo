// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services

import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.storage.ExponentSharedPreferences
import org.json.JSONException
import org.json.JSONObject
import java.util.*
import javax.inject.Inject

private const val FIVE_MINUTES_MS = (5 * 60 * 1000).toLong()
private const val AUTO_RELOAD_BUFFER_BASE_MS = (5 * 1000).toLong()

class ErrorRecoveryManager(private val experienceKey: ExperienceKey?) {
  private var timeLastLoaded = 0L
  private var didError = false

  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  fun markExperienceLoaded() {
    timeLastLoaded = System.currentTimeMillis()
    timeAnyExperienceLoaded = timeLastLoaded
    markErrored(false)
  }

  @JvmOverloads
  fun markErrored(didError: Boolean = true) {
    this.didError = didError
    if (experienceKey != null) {
      val metadata = exponentSharedPreferences.getExperienceMetadata(experienceKey) ?: JSONObject()
      try {
        metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_LOADING_ERROR, didError)
        exponentSharedPreferences.updateExperienceMetadata(experienceKey, metadata)
      } catch (e: JSONException) {
        e.printStackTrace()
      }
    }
  }

  fun shouldReloadOnError(): Boolean {
    val diff = System.currentTimeMillis() - timeLastLoaded
    val reloadBuffer = reloadBuffer()
    return diff >= reloadBuffer
  }

  private fun reloadBuffer(): Long {
    var interval = Math.min(
      FIVE_MINUTES_MS,
      (
        AUTO_RELOAD_BUFFER_BASE_MS * Math.pow(
          1.5,
          reloadBufferDepth.toDouble()
        )
        ).toLong()
    )
    val timeSinceLastExperienceLoaded = System.currentTimeMillis() - timeAnyExperienceLoaded
    if (timeSinceLastExperienceLoaded > interval * 2) {
      reloadBufferDepth = 0
      interval = AUTO_RELOAD_BUFFER_BASE_MS
    }
    return interval
  }

  companion object {
    private val experienceScopeKeyToManager: MutableMap<String, ErrorRecoveryManager> = HashMap()
    private var timeAnyExperienceLoaded: Long = 0

    // This goes up when there are a bunch of errors in succession
    private var reloadBufferDepth: Long = 0

    @JvmStatic fun getInstance(experienceKey: ExperienceKey): ErrorRecoveryManager {
      if (!experienceScopeKeyToManager.containsKey(experienceKey.scopeKey)) {
        experienceScopeKeyToManager[experienceKey.scopeKey] = ErrorRecoveryManager(experienceKey)
      }
      return experienceScopeKeyToManager[experienceKey.scopeKey]!!
    }
  }

  init {
    NativeModuleDepsProvider.instance.inject(ErrorRecoveryManager::class.java, this)
  }
}
