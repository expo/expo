// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.os.Bundle;
import android.util.Log;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;

import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.JSONBundleConverter;
import host.exp.expoview.Exponent;

public class InfoActivity extends MultipleVersionReactNativeActivity {

  private static final String TAG = InfoActivity.class.getSimpleName();

  public static final String MANIFEST_URL_KEY = "manifestUrl";

  private static final String INFO_MODULE_NAME = "InfoScreenApp";

  private String mManifestUrl;
  private JSONObject mManifest;
  private ReactRootView mReactRootView;

  @Inject
  Kernel mKernel;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mShouldDestroyRNInstanceOnExit = false;

    NativeModuleDepsProvider.getInstance().inject(InfoActivity.class, this);

    Bundle bundle = getIntent().getExtras();
    mManifestUrl = bundle.getString(MANIFEST_URL_KEY);
    if (mManifestUrl != null) {
      ExponentSharedPreferences.ManifestAndBundleUrl manifestAndBundleUrl = mExponentSharedPreferences.getManifest(mManifestUrl);
      if (manifestAndBundleUrl != null) {
         mManifest = manifestAndBundleUrl.manifest;
      }
    }

    EventBus.getDefault().registerSticky(this);

    if (!mKernel.isStarted()) {
      mKernel.startJSKernel();
    }
  }

  public void onEventMainThread(Kernel.KernelStartedRunningEvent event) {
    if (!mKernel.isRunning()) {
      return;
    }

    Bundle bundle = new Bundle();
    JSONObject exponentProps = new JSONObject();

    if (mManifestUrl != null) {
      try {
        exponentProps.put("manifestUrl", mManifestUrl);
      } catch (JSONException e) {
        EXL.e(TAG, e);
      }
    }

    if (mManifest != null) {
      try {
        exponentProps.put("manifest", mManifest);
      } catch (JSONException e) {
        EXL.e(TAG, e);
      }
    }

    bundle.putBundle("exp", JSONBundleConverter.JSONToBundle(exponentProps));

    mReactInstanceManager.assign(mKernel.getReactInstanceManager());
    mReactRootView = new ReactRootView(this);
    mReactRootView.startReactApplication(
        (ReactInstanceManager) mReactInstanceManager.get(),
        INFO_MODULE_NAME,
        bundle
    );
    mReactInstanceManager.onHostResume(this, this);
    setContentView(mReactRootView);
  }
}
