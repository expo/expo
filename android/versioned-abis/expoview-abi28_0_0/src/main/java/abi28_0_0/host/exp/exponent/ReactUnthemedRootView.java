// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent;

import android.content.Context;
import android.view.ContextThemeWrapper;

import abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerEnabledRootView;
import host.exp.expoview.R;

public class ReactUnthemedRootView extends RNGestureHandlerEnabledRootView {
  public ReactUnthemedRootView(Context context) {
    super(new ContextThemeWrapper(
        context,
        R.style.Theme_Exponent_None
    ));
  }
}
