package expo.modules.lineargradient;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.BasePackage;
import expo.modules.core.ViewManager;

public class LinearGradientPackage extends BasePackage {
  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.singletonList((ViewManager) new LinearGradientManager());
  }
}
