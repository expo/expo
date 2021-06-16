package abi42_0_0.expo.modules.ads.facebook;

import android.content.Context;

import com.facebook.ads.Ad;
import com.facebook.ads.AdError;
import com.facebook.ads.InterstitialAd;
import com.facebook.ads.InterstitialAdListener;

import abi42_0_0.org.unimodules.core.ExportedModule;
import abi42_0_0.org.unimodules.core.ModuleRegistry;
import abi42_0_0.org.unimodules.core.Promise;
import abi42_0_0.org.unimodules.core.interfaces.ActivityProvider;
import abi42_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi42_0_0.org.unimodules.core.interfaces.LifecycleEventListener;
import abi42_0_0.org.unimodules.core.interfaces.services.UIManager;

public class InterstitialAdManager extends ExportedModule implements InterstitialAdListener, LifecycleEventListener {
  private Promise mPromise;
  private boolean mDidClick = false;
  private InterstitialAd mInterstitial;
  private UIManager mUIManager;
  private ActivityProvider mActivityProvider;

  public InterstitialAdManager(Context reactContext) {
    super(reactContext);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    if (mUIManager != null) {
      mUIManager.unregisterLifecycleEventListener(this);
    }
    mUIManager = moduleRegistry.getModule(UIManager.class);
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mUIManager.registerLifecycleEventListener(this);
  }

  @ExpoMethod
  public void showAd(String placementId, Promise p) {
    if (mPromise != null) {
      p.reject("E_FAILED_TO_SHOW", "Only one `showAd` can be called at once");
      return;
    }

    mPromise = p;
    mInterstitial = new InterstitialAd(mActivityProvider.getCurrentActivity(), placementId);
    mInterstitial.loadAd(mInterstitial.buildLoadAdConfig().withAdListener(this).build());
  }

  @Override
  public String getName() {
    return "CTKInterstitialAdManager";
  }

  @Override
  public void onError(Ad ad, AdError adError) {
    mPromise.reject("E_FAILED_TO_LOAD", adError.getErrorMessage());
    cleanUp();
  }

  @Override
  public void onAdLoaded(Ad ad) {
    if (ad == mInterstitial) {
      mInterstitial.show();
    }
  }

  @Override
  public void onAdClicked(Ad ad) {
    mDidClick = true;
  }

  @Override
  public void onInterstitialDismissed(Ad ad) {
    mPromise.resolve(mDidClick);
    cleanUp();
  }

  @Override
  public void onInterstitialDisplayed(Ad ad) {

  }

  @Override
  public void onLoggingImpression(Ad ad) {
  }

  private void cleanUp() {
    mPromise = null;
    mDidClick = false;

    if (mInterstitial != null) {
      mInterstitial.destroy();
      mInterstitial = null;
    }
  }

  @Override
  public void onHostResume() {

  }

  @Override
  public void onHostPause() {

  }

  @Override
  public void onHostDestroy() {
    cleanUp();
    mUIManager.unregisterLifecycleEventListener(this);
    mUIManager = null;
  }
}
