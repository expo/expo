// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.referrer;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.amplitude.api.Amplitude;
import com.google.android.gms.analytics.CampaignTrackingReceiver;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;

import javax.inject.Inject;

import host.exp.exponent.Constants;
import host.exp.exponent.ExponentApplication;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class InstallReferrerReceiver extends CampaignTrackingReceiver {

  private static final String TAG = InstallReferrerReceiver.class.getSimpleName();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  Kernel mKernel;

  @Inject
  ExponentNetwork mExponentNetwork;

  @Inject
  ExponentManifest mExponentManifest;

  @Override
  public void onReceive(Context context, Intent intent) {
    super.onReceive(context, intent);

    if (!(context.getApplicationContext() instanceof ExponentApplication)) {
      EXL.e(TAG, "InstallReferrerReceiver.context.getApplicationContext() not an instance of ExponentApplication");
      return;
    }

    NativeModuleDepsProvider.getInstance().inject(this);

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
    Amplitude.getInstance().logEvent("INSTALL_REFERRER_RECEIVED", eventProperties);

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

    mExponentManifest.fetchManifest(Constants.INITIAL_URL, new ExponentManifest.ManifestListener() {
      @Override
      public void onCompleted(JSONObject manifest) {
        try {
          String bundleUrl = manifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY);

          mExponentSharedPreferences.updateManifest(Constants.INITIAL_URL, manifest, bundleUrl);
          preloadBundle(
              bundleUrl,
              manifest.getString(ExponentManifest.MANIFEST_ID_KEY),
              manifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY));
        } catch (JSONException e) {
          EXL.e(TAG, e);
        } catch (Exception e) {
          // Don't let any errors through
          EXL.e(TAG, "Couldn't preload bundle: " + e.toString());
        }
      }

      @Override
      public void onError(Exception e) {
        EXL.e(TAG, "Couldn't preload manifest: " + e.toString());
      }

      @Override
      public void onError(String e) {
        EXL.e(TAG, "Couldn't preload manifest: " + e);
      }
    });
  }

  private void preloadBundle(final String bundleUrl, final String id, final String sdkVersion) {
    try {
      mKernel.loadJSBundle(bundleUrl, mKernel.encodeExperienceId(id), sdkVersion, new Kernel.BundleListener() {
        @Override
        public void onError(Exception e) {
          EXL.e(TAG, "Couldn't preload bundle: " + e.toString());
        }

        @Override
        public void onBundleLoaded(String localBundlePath) {
          EXL.d(TAG, "Successfully preloaded manifest and bundle for " + Constants.INITIAL_URL + " " + bundleUrl);
        }
      });
    } catch (UnsupportedEncodingException e) {
      EXL.e(TAG, "Couldn't encode preloaded bundle id: " + e.toString());
    }
  }
}
