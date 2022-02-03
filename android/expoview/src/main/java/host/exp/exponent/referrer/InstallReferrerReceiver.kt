// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.referrer

import android.content.Context
import android.content.Intent
import com.google.android.gms.analytics.CampaignTrackingReceiver
import host.exp.exponent.ExpoApplication
import host.exp.exponent.analytics.Analytics
import host.exp.exponent.analytics.EXL
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.storage.ExponentSharedPreferences
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
    NativeModuleDepsProvider.instance.inject(InstallReferrerReceiver::class.java, this)

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
  }

  companion object {
    private val TAG = InstallReferrerReceiver::class.java.simpleName
  }
}
