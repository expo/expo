// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.os.Bundle;

import com.facebook.react.ReactPackage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

import host.exp.exponent.AppLoader;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.expoview.ExpoViewBuildConfig;
import host.exp.expoview.Exponent;

public abstract class DetachActivity extends ExperienceActivity {

  // Override me!
  public abstract String publishedUrl();
  public abstract String developmentUrl();
  public abstract List<String> sdkVersions();
  public abstract List<ReactPackage> reactPackages();
  public abstract boolean isDebug();

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    ExpoViewBuildConfig.DEBUG = isDebug();
    Constants.setSdkVersions(sdkVersions());
    String defaultUrl = isDebug() ? developmentUrl() : publishedUrl();
    Constants.INITIAL_URL = defaultUrl;

    new AppLoader(Constants.INITIAL_URL, mExponentManifest, mExponentSharedPreferences) {
      @Override
      public void onOptimisticManifest(final JSONObject optimisticManifest) {
        Exponent.getInstance().runOnUiThread(new Runnable() {
          @Override
          public void run() {
            setLoadingScreenManifest(optimisticManifest);
          }
        });
      }

      @Override
      public void onManifestCompleted(final JSONObject manifest) {
        Exponent.getInstance().runOnUiThread(new Runnable() {
          @Override
          public void run() {
            try {
              String bundleUrl = ExponentUrls.toHttp(manifest.getString("bundleUrl"));
              JSONObject opts = new JSONObject();
              opts.put(KernelConstants.OPTION_LOAD_NUX_KEY, false);

              setManifest(Constants.INITIAL_URL, manifest, bundleUrl, opts);
            } catch (JSONException e) {
              mKernel.handleError(e);
            }
          }
        });
      }

      @Override
      public void onBundleCompleted(String localBundlePath) {
        setBundle(localBundlePath);
      }

      @Override
      public void onError(Exception e) {
        mKernel.handleError(e);
      }

      @Override
      public void onError(String e) {
        mKernel.handleError(e);
      }
    }.start();
  }

  @Override
  public boolean forceUnversioned() {
    return true;
  }
}
