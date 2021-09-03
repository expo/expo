package host.exp.exponent.utils

import android.app.Application
import android.os.Build
import android.view.Gravity
import android.widget.Toast
import expo.modules.manifests.core.Manifest
import expo.modules.updates.manifest.ManifestFactory
import host.exp.exponent.di.NativeModuleDepsProvider
import org.json.JSONObject
import javax.inject.Inject

// TODO: Remove when we drop support for SDK 40

object ToastHelper {
  @Inject
  lateinit var applicationContext: Application

  init {
    NativeModuleDepsProvider.instance.inject(ToastHelper::class.java, this)
  }

  fun functionMayNotWorkOnAndroidRWarning(featureName: String, manifestJson: JSONObject?) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        if (manifestJson == null) {
          return
        }

        val manifest = Manifest.fromManifestJson(manifestJson)
        if (!manifest.isDevelopmentMode()) {
          return
        }

        applicationContext.let {
          val message = "$featureName may not work in Expo Go when you're using Android R.\nSee https://expo.fyi/android-r"
          Toast
            .makeText(it, message, Toast.LENGTH_LONG)
            .apply {
              setGravity(Gravity.CENTER or Gravity.BOTTOM, 0, 0)
            }
            .show()
        }
      }
    } catch (exception: Throwable) {
      // We don't want to break something
      exception.printStackTrace()
    }
  }
}
