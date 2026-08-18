package host.exp.exponent.utils

import android.content.Context
import com.facebook.react.modules.i18nmanager.I18nUtil
import expo.modules.manifests.core.Manifest

class ExperienceRTLManager {
  companion object {
    fun setRTLPreferences(context: Context, supportsRTL: Boolean, forcesRTL: Boolean) {
      // We call these methods before React loads to ensure it gets rendered correctly the first time the app is opened.
      I18nUtil.instance.allowRTL(context, supportsRTL)
      I18nUtil.instance.forceRTL(context, forcesRTL)
    }

    fun setRTLPreferencesFromManifest(context: Context, manifest: Manifest) {
      // get supportsRTL from manifest and set it in shared preferences
      val extra = manifest.getExpoClientConfigRootObject()?.optJSONObject("extra")
      val supportsRTL = extra?.optBoolean("supportsRTL") ?: true
      val forcesRTL = extra?.optBoolean("forcesRTL") ?: false

      setRTLPreferences(context, supportsRTL, forcesRTL)
    }
  }
}
