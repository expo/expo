package expo.modules.ads.admob;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;
import expo.core.ViewManager;

public class AdMobPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Arrays.<ExportedModule>asList(
        new AdMobInterstitialAdModule(context),
        new AdMobRewardedVideoAdModule(context));
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Arrays.<ViewManager>asList(
        new AdMobBannerViewManager(),
        new PublisherBannerViewManager());
  }
}
