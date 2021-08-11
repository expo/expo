// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.referrer

import android.content.Context
import android.content.Intent
import com.google.android.gms.analytics.CampaignTrackingReceiver
import host.exp.exponent.Constants
import host.exp.exponent.ExpoApplication
import host.exp.exponent.analytics.Analytics
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.storage.ExponentSharedPreferences
import host.exp.expoview.Exponent
import org.json.JSONException
import org.json.JSONObject
import javax.inject.Inject

class InstallReferrerReceiver : CampaignTrackingReceiver() {
  @Inject
  lateinit var exponentSharedPreferences: ExponentSharedPreferences

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (context.applicationContext !is ExpoApplication) {
      EXL.e(
        TAG,
        "InstallReferrerReceiver.context.getApplicationContext() not an instance of ExpoApplication"
      )
      return
    }
    NativeModuleDepsProvider.getInstance().inject(InstallReferrerReceiver::class.java, this)

    val referrer = intent.getStringExtra("referrer")
    EXL.d(TAG, "Referrer: $referrer")
    if (referrer != null) {
      exponentSharedPreferences.setString(ExponentSharedPreferences.ExponentSharedPreferencesKey.REFERRER_KEY, referrer)
    }

    // Analytics
    val eventProperties = JSONObject().apply {
      try {
        put("REFERRER", referrer ?: "")
      } catch (e: JSONException) {
        EXL.e(TAG, e.message!!)
      }
    }
    Analytics.logEvent(Analytics.AnalyticsEvent.INSTALL_REFERRER_RECEIVED, eventProperties)

    // Preload manifest + bundle if possible
    try {
      preload()
    } catch (e: Throwable) {
      // Don't let any errors through
      EXL.e(TAG, "Couldn't preload: $e")
    }
  }

  private fun preload() {
    if (Constants.INITIAL_URL == null) {
      return
    }
    Exponent.instance.preloadManifestAndBundle(Constants.INITIAL_URL)
  }

  companion object {
    private val TAG = InstallReferrerReceiver::class.java.simpleName
  }
}
