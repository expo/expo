package host.exp.exponent.utils

import android.content.Context
import expo.modules.manifests.core.Manifest

// must be kept in sync with https://github.com/facebook/react-native/blob/main/ReactAndroid/src/main/java/com/facebook/react/modules/i18nmanager/I18nUtil.java
private const val SHARED_PREFS_NAME = "com.facebook.react.modules.i18nmanager.I18nUtil"
private const val KEY_FOR_PREFS_ALLOWRTL = "RCTI18nUtil_allowRTL"
private const val KEY_FOR_PREFS_FORCERTL = "RCTI18nUtil_forceRTL"

class ExperienceRTLManager {
  companion object {
    fun setRTLPreferences(context: Context, allowRTL: Boolean, forceRTL: Boolean) {
      // These keys are used by React Native here: https://github.com/facebook/react-native/blob/main/React/Modules/RCTI18nUtil.m
      // We set them before React loads to ensure it gets rendered correctly the first time the app is opened.
      context
        .getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .also {
          it.putBoolean(KEY_FOR_PREFS_ALLOWRTL, allowRTL)
          it.putBoolean(KEY_FOR_PREFS_FORCERTL, forceRTL)
          it.apply()
        }
    }

    fun setRTLPreferencesFromManifest(context: Context, manifest: Manifest) {
      // get supportsRTL from manifest and set it in shared preferences
      val supportsRTL = manifest.getExpoClientConfigRootObject()?.optJSONObject("extra")?.optBoolean("supportsRTL") ?: false
      val forcesRTL = manifest.getExpoClientConfigRootObject()?.optJSONObject("extra")?.optBoolean("forcesRTL") ?: false
      if (forcesRTL) {
        setRTLPreferences(context, true, true)
      } else {
        setRTLPreferences(context, supportsRTL, false)
      }
    }
  }
}
