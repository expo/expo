package host.exp.exponent.utils

import android.content.Context
import android.content.SharedPreferences
import expo.modules.manifests.core.Manifest

// must be kept in sync with https://github.com/facebook/react-native/blob/main/ReactAndroid/src/main/java/com/facebook/react/modules/i18nmanager/I18nUtil.java
private const val SHARED_PREFS_NAME = "com.facebook.react.modules.i18nmanager.I18nUtil"
private const val KEY_FOR_PREFS_ALLOWRTL = "RCTI18nUtil_allowRTL"

class ExperienceRTLManager {
  companion object {
    fun setSupportsRTL(context: Context, allowRTL: Boolean) {
      // These keys are used by React Native here: https://github.com/facebook/react-native/blob/main/React/Modules/RCTI18nUtil.m
      // We set them before React loads to ensure it gets rendered correctly the first time the app is opened.
      val editor: SharedPreferences.Editor =
        context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE).edit()
      editor.putBoolean(KEY_FOR_PREFS_ALLOWRTL, allowRTL)
      editor.apply()
    }

    fun setSupportsRTLFromManifest(context: Context, manifest: Manifest) {
      setSupportsRTL(context, manifest.getSupportsRTL() ?: false)
    }
  }
}
