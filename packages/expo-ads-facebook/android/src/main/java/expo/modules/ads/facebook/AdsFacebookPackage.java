package expo.modules.ads.facebook;

import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;
import expo.core.ViewManager;
import expo.core.interfaces.InternalModule;

public class AdsFacebookPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new NativeAdManager(context));
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Arrays.<ExportedModule>asList(new AdSettingsManager(context), new InterstitialAdManager(context), new NativeAdModule(context));
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Arrays.asList(new AdIconViewManager(), new BannerViewManager(), new MediaViewManager(), new NativeAdViewManager());
  }
}
