// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactPackage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;

import expo.adapters.react.ReactModuleRegistryProvider;
import expo.core.interfaces.Package;
import host.exp.exponent.AppLoader;
import host.exp.exponent.Constants;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.expoview.ExpoViewBuildConfig;
import host.exp.expoview.Exponent;
import versioned.host.exp.exponent.ExponentPackageDelegate;
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;

public abstract class DetachActivity extends ExperienceActivity implements ExponentPackageDelegate {

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

    mKernel.handleIntent(this, getIntent());

    new AppLoader(Constants.INITIAL_URL) {
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
      public void emitEvent(JSONObject params) {
        emitUpdatesEvent(params);
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
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    mKernel.handleIntent(this, intent);
  }

  // TODO: eric: make Constants.INITIAL_URI reliable so we can get rid of this
  @Override
  public void shouldCheckOptions() {
    if (mManifestUrl != null && mKernel.hasOptionsForManifestUrl(mManifestUrl)) {
      handleOptions(mKernel.popOptionsForManifestUrl(mManifestUrl));
    } else if (isDebug() && mKernel.hasOptionsForManifestUrl(publishedUrl())) {
      // also check publishedUrl since this can get set before Constants.INITIAL_URL is set to developmentUrl
      handleOptions(mKernel.popOptionsForManifestUrl(publishedUrl()));
    }
  }

  @Override
  public boolean forceUnversioned() {
    return true;
  }

  @Override
  public List<Package> expoPackages() {
    // Override to add your own packages.
    return Collections.emptyList();
  }

  @Override
  public ExponentPackageDelegate getExponentPackageDelegate() {
    return this;
  }

  @Override
  public ExpoModuleRegistryAdapter getScopedModuleRegistryAdapterForPackages(List<Package> packages) {
    return new DetachedModuleRegistryAdapter(new ReactModuleRegistryProvider(packages));
  }
}
