// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.analytics.segment

import android.content.Context
import android.content.SharedPreferences
import com.segment.analytics.Analytics
import com.segment.analytics.Options
import com.segment.analytics.Properties
import com.segment.analytics.Traits
import com.segment.analytics.android.integrations.firebase.FirebaseIntegration
import expo.modules.interfaces.constants.ConstantsInterface
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import java.util.*

class SegmentModule(private val mContext: Context) : ExportedModule(mContext) {
  private var mClient: Analytics? = null
  private var mConstants: ConstantsInterface? = null

  // We have to keep track of `enabled` on our own.
  // Since we have to change tag every time (see commit 083f051), Segment may or may not properly apply
  // remembered preference to the instance. The module in a standalone app would start disabled
  // (settings = { 0 => disabled }, tag = 0) but after OTA update it would reload with
  // (settings = { 0 => disabled }, tag = 1) and segment would become enabled if the app does not
  // disable it on start.
  private val mSharedPreferences: SharedPreferences = mContext.getSharedPreferences(NAME, Context.MODE_PRIVATE)

  override fun getName(): String {
    return NAME
  }

  @ExpoMethod
  fun initialize(writeKey: String, promise: Promise) {
    val builder = Analytics.Builder(mContext, writeKey)
    builder.experimentalUseNewLifecycleMethods(false)
    builder.tag((sCurrentTag++).toString())
    builder.use(FirebaseIntegration.FACTORY)
    mClient = builder.build()
    mClient!!.optOut(!enabledPreferenceValue)
    promise.resolve(null)
  }

  @ExpoMethod
  fun identify(userId: String, promise: Promise) {
    mClient?.identify(userId)
    promise.resolve(null)
  }

  @ExpoMethod
  fun identifyWithTraits(userId: String, properties: Map<String, Any>, options: Map<String, Any?>?, promise: Promise) {
    mClient?.identify(userId, readableMapToTraits(properties), readableMapToOptions(options))
    promise.resolve(null)
  }

  @ExpoMethod
  fun track(eventName: String, promise: Promise) {
    mClient?.track(eventName)
    promise.resolve(null)
  }

  @ExpoMethod
  fun trackWithProperties(eventName: String, properties: Map<String, Any>, options: Map<String, Any?>?, promise: Promise) {
    mClient?.track(eventName, readableMapToProperties(properties), readableMapToOptions(options))
    promise.resolve(null)
  }

  @ExpoMethod
  fun alias(newId: String, options: Map<String, Any?>?, promise: Promise) {
    val client = mClient
    if (client != null) {
      client.alias(newId, readableMapToOptions(options))
      promise.resolve(null)
    } else {
      promise.reject("E_NO_SEG", "Segment instance has not been initialized yet, have you tried calling Segment.initialize prior to calling Segment.alias?")
    }
  }

  @ExpoMethod
  fun group(groupId: String, promise: Promise) {
    mClient?.group(groupId)
    promise.resolve(null)
  }

  @ExpoMethod
  fun groupWithTraits(groupId: String, properties: Map<String, Any>, options: Map<String, Any?>?, promise: Promise) {
    mClient?.group(groupId, readableMapToTraits(properties), readableMapToOptions(options))
    promise.resolve(null)
  }

  @ExpoMethod
  fun screen(screenName: String, promise: Promise) {
    mClient?.screen(screenName)
    promise.resolve(null)
  }

  @ExpoMethod
  fun screenWithProperties(screenName: String, properties: Map<String, Any>, options: Map<String, Any?>?, promise: Promise) {
    mClient?.screen(null, screenName, readableMapToProperties(properties), readableMapToOptions(options))
    promise.resolve(null)
  }

  @ExpoMethod
  fun flush(promise: Promise) {
    mClient?.flush()
    promise.resolve(null)
  }

  @ExpoMethod
  fun reset(promise: Promise) {
    mClient?.reset()
    promise.resolve(null)
  }

  @ExpoMethod
  fun getEnabledAsync(promise: Promise) {
    promise.resolve(enabledPreferenceValue)
  }

  @ExpoMethod
  fun setEnabledAsync(enabled: Boolean, promise: Promise) {
    if (mConstants!!.appOwnership == "expo") {
      promise.reject("E_UNSUPPORTED", "Setting Segment's `enabled` is not supported in Expo Go.")
      return
    }
    mSharedPreferences.edit().putBoolean(ENABLED_PREFERENCE_KEY, enabled).apply()
    mClient?.optOut(!enabled)
    promise.resolve(null)
  }

  override fun onCreate(moduleRegistry: ModuleRegistry?) {
    mConstants = null
    mConstants = moduleRegistry?.getModule(ConstantsInterface::class.java)
  }

  private val enabledPreferenceValue: Boolean
     get() = mSharedPreferences.getBoolean(ENABLED_PREFERENCE_KEY, true)

  companion object {
    private const val NAME = "ExponentSegment"
    private const val ENABLED_PREFERENCE_KEY = "enabled"
    private val TAG = SegmentModule::class.java.simpleName
    private var sCurrentTag = 0
    private fun readableMapToTraits(properties: Map<String, Any>): Traits {
      val traits = Traits()
      for (key in properties.keys) {
        val value = properties[key]
        if (value is Map<*, *>) {
          traits[key] = coalesceAnonymousMapToJsonObject(value as Map<*, *>?)
        } else {
          traits[key] = value
        }
      }
      return traits
    }

    private fun coalesceAnonymousMapToJsonObject(map: Map<*, *>?): Map<String, Any?> {
      val validObject: MutableMap<String, Any?> = HashMap()
      for (key in map!!.keys) {
        if (key is String) {
          val value = map[key]
          if (value is Map<*, *>) {
            validObject[key] = coalesceAnonymousMapToJsonObject(value as Map<*, *>?)
          } else {
            validObject[key] = value
          }
        }
      }
      return validObject
    }

    private fun readableMapToOptions(properties: Map<String, Any?>?): Options {
      var options = Options()
      if (properties != null) {
        for ((keyName, value) in properties) {
          if (keyName == "context" && value != null) {
            val contexts: Map<String, Any>? = value as Map<String, Any>?
            for ((key, value1) in contexts!!) {
              options.putContext(key, value1)
            }
          } else if (keyName == "integrations" && value != null) {
            options = addIntegrationsToOptions(options, value as Map<String, Any>?)
          }
        }
      }
      return options
    }

    private fun addIntegrationsToOptions(options: Options, integrations: Map<String, Any>?): Options {
      for ((integrationKey, integrationOptions) in integrations!!) {
        if (integrationOptions is Map<*, *>) {
          if (integrationOptions["enabled"] is Boolean) {
            val enabled = integrationOptions["enabled"] as Boolean
            options.setIntegration(integrationKey, enabled)
          } else if (integrationOptions["enabled"] is String) {
            val enabled = integrationOptions["enabled"] as String?
            options.setIntegration(integrationKey, java.lang.Boolean.valueOf(enabled))
          }
          if (integrationOptions["options"] is Map<*, *>) {
            val jsonOptions = coalesceAnonymousMapToJsonObject(integrationOptions["options"] as Map<*, *>?)
            options.setIntegrationOptions(integrationKey, jsonOptions)
          }
        }
      }
      return options
    }

    private fun readableMapToProperties(properties: Map<String, Any>): Properties {
      val result = Properties()
      for (key in properties.keys) {
        val value = properties[key]
        if (value is Map<*, *>) {
          result[key] = coalesceAnonymousMapToJsonObject(value as Map<*, *>?)
        } else {
          result[key] = value
        }
      }
      return result
    }
  }
}