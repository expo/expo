package versioned.host.exp.exponent.modules.api.screens;

import android.view.View;

import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

@ReactModule(name = ScreenContainerViewManager.REACT_CLASS)
public class ScreenContainerViewManager extends ViewGroupManager<ScreenContainer> {

  protected static final String REACT_CLASS = "RNSScreenContainer";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ScreenContainer createViewInstance(ThemedReactContext reactContext) {
    return new ScreenContainer(reactContext);
  }

  @Override
  public void addView(ScreenContainer parent, View child, int index) {
    if (!(child instanceof Screen)) {
      throw new IllegalArgumentException("Attempt attach child that is not of type RNScreens");
    }
    parent.addScreen((Screen) child, index);
  }

  @Override
  public void removeViewAt(ScreenContainer parent, int index) {
    parent.removeScreenAt(index);
  }

  @Override
  public void removeAllViews(ScreenContainer parent) {
    parent.removeAllScreens();
  }

  @Override
  public int getChildCount(ScreenContainer parent) {
    return parent.getScreenCount();
  }

  @Override
  public View getChildAt(ScreenContainer parent, int index) {
    return parent.getScreenAt(index);
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }
}
