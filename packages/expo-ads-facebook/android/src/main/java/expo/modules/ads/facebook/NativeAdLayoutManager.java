package expo.modules.ads.facebook;

import android.content.Context;

import org.unimodules.core.ViewManager;

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
