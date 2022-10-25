package host.exp.exponent.utils

import android.content.Context
import android.content.SharedPreferences
import expo.modules.manifests.core.Manifest

// must be kept in sync with https://github.com/facebook/react-native/blob/main/ReactAndroid/src/main/java/com/facebook/react/modules/i18nmanager/I18nUtil.java
private const val SHARED_PREFS_NAME = "com.facebook.react.modules.i18nmanager.I18nUtil"
private const val KEY_FOR_PREFS_ALLOWRTL = "RCTI18nUtil_allowRTL"

class ExperienceRTLManager {
  companion object {
    fun setRTLPref(context: Context, allowRTL: Boolean) {
      val editor: SharedPreferences.Editor =
        context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE).edit()
      editor.putBoolean(KEY_FOR_PREFS_ALLOWRTL, allowRTL)
      editor.apply()
    }

    fun setRTLPrefFromManifest(context: Context, manifest: Manifest) {
      setRTLPref(context, manifest.getAllowRTL() ?: false)
    }
  }
}
