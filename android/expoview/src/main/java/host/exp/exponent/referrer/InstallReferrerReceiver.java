// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.referrer;

import android.content.Context;
import android.content.Intent;

import com.google.android.gms.analytics.CampaignTrackingReceiver;

import host.exp.exponent.ExpoApplication;
import host.exp.exponent.analytics.Analytics;
import io.branch.referral.InstallListener;

import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;

public class InstallReferrerReceiver extends CampaignTrackingReceiver {

  private static final String TAG = InstallReferrerReceiver.class.getSimpleName();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Override
  public void onReceive(Context context, Intent intent) {
    super.onReceive(context, intent);

    if (!(context.getApplicationContext() instanceof ExpoApplication)) {
      EXL.e(TAG, "InstallReferrerReceiver.context.getApplicationContext() not an instance of ExpoApplication");
      return;
    }

    InstallListener listener = new InstallListener();
    listener.onReceive(context, intent);

    NativeModuleDepsProvider.getInstance().inject(InstallReferrerReceiver.class, this);

    String referrer = intent.getStringExtra("referrer");
    EXL.d(TAG, "Referrer: " + referrer);

    if (referrer != null) {
      mExponentSharedPreferences.setString(ExponentSharedPreferences.REFERRER_KEY, referrer);
    }

    // Analytics
    JSONObject eventProperties = new JSONObject();
    try {
      eventProperties.put("REFERRER", referrer == null ? "" : referrer);
    } catch (JSONException e) {
      EXL.e(TAG, e.getMessage());
    }
    Analytics.logEvent("INSTALL_REFERRER_RECEIVED", eventProperties);

    // Preload manifest + bundle if possible
    try {
      preload();
    } catch (Throwable e) {
      // Don't let any errors through
      EXL.e(TAG, "Couldn't preload: " + e.toString());
    }
  }

  private void preload() {
    if (Constants.INITIAL_URL == null) {
      return;
    }

    Exponent.getInstance().preloadManifestAndBundle(Constants.INITIAL_URL);
  }
}
