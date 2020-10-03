// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;

import java.util.List;

import org.unimodules.adapters.react.ReactModuleRegistryProvider;
import org.unimodules.core.interfaces.Package;
import org.unimodules.core.interfaces.SingletonModule;

import expo.modules.splashscreen.SplashScreenImageResizeMode;
import expo.modules.splashscreen.singletons.SplashScreen;
import host.exp.exponent.Constants;
import host.exp.expoview.ExpoViewBuildConfig;
import versioned.host.exp.exponent.ExponentPackageDelegate;
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter;

public abstract class DetachActivity extends ExperienceActivity implements ExponentPackageDelegate {

  // Override me!
  public abstract String publishedUrl();
  public abstract String developmentUrl();
  public abstract List<ReactPackage> reactPackages();
  public abstract List<Package> expoPackages();
  public abstract boolean isDebug();

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    ExpoViewBuildConfig.DEBUG = isDebug();
    Constants.INITIAL_URL = isDebug() ? developmentUrl() : publishedUrl();
    mManifestUrl = Constants.INITIAL_URL;

    if (getIntent().getData() != null) {
      mIntentUri = getIntent().getData().toString();
    }

    super.onCreate(savedInstanceState);

    SplashScreen.show(this, Constants.SPLASH_SCREEN_IMAGE_RESIZE_MODE, ReactRootView.class, true);

    mKernel.handleIntent(this, getIntent());
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
  public ExponentPackageDelegate getExponentPackageDelegate() {
    return this;
  }

  @Override
  public ExpoModuleRegistryAdapter getScopedModuleRegistryAdapterForPackages(List<Package> packages, List<SingletonModule> singletonModules) {
    return new DetachedModuleRegistryAdapter(new ReactModuleRegistryProvider(packages, singletonModules));
  }
}
