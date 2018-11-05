package abi30_0_0.host.exp.exponent.modules.api.screens;

import android.content.Context;

import java.util.List;

public class ScreenStack extends ScreenContainer {

  private float mTransitioning;

  public ScreenStack(Context context) {
    super(context);
  }

  public void setTransitioning(float transitioning) {
    if (transitioning != mTransitioning) {
      mTransitioning = transitioning;
      markUpdated();
    }
  }

  @Override
  protected boolean isScreenActive(Screen screen, List<Screen> allScreens) {
    int size = allScreens.size();
    if (size < 1) {
      return false;
    }
    Screen lastScreen = allScreens.get(size - 1);
    if (mTransitioning != 0 && size > 1) {
      Screen secondToLast = allScreens.get(size - 2);
      return screen == lastScreen || screen == secondToLast;
    }
    return screen == lastScreen;
  }
}
