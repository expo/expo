package abi44_0_0.expo.modules.ads.facebook;

import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi44_0_0.expo.modules.core.BasePackage;
import abi44_0_0.expo.modules.core.ExportedModule;
import abi44_0_0.expo.modules.core.ViewManager;
import abi44_0_0.expo.modules.core.interfaces.InternalModule;

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
    return Arrays.asList(
        new NativeAdLayoutManager(),
        new AdIconViewManager(),
        new BannerViewManager(),
        new MediaViewManager(),
        new NativeAdViewManager(),
        new AdOptionsWrapperViewManager()
    );
  }
}
