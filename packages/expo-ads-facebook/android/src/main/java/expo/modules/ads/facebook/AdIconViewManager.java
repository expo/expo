package expo.modules.ads.facebook;

import android.content.Context;

import com.facebook.ads.AdIconView;

import org.unimodules.core.ViewManager;

public class AdIconViewManager extends ViewManager {
  @Override
  public String getName() {
    return "AdIconView";
  }

  @Override
  public AdIconView createViewInstance(Context context) {
    return new AdIconView(context);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.SIMPLE;
  }
}
