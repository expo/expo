package abi40_0_0.expo.modules.lineargradient;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi40_0_0.org.unimodules.core.BasePackage;
import abi40_0_0.org.unimodules.core.ViewManager;

public class LinearGradientPackage extends BasePackage {
  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.singletonList((ViewManager) new LinearGradientManager());
  }
}
