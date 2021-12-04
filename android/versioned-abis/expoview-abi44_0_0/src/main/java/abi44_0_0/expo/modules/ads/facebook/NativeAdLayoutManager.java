package abi44_0_0.expo.modules.ads.facebook;

import android.content.Context;

import abi44_0_0.expo.modules.core.ViewManager;

public class NativeAdLayoutManager extends ViewManager<NativeAdLayout>  {
  private static String NAME = "NativeAdLayout";

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public NativeAdLayout createViewInstance(Context context) {
    return new NativeAdLayout(context);
  }

  @Override
  public ViewManager.ViewManagerType getViewManagerType() {
    return ViewManagerType.GROUP;
  }
}
