// Copyright 2015-present 650 Industries. All rights reserved.

package abi10_0_0.host.exp.exponent;

import android.content.Context;
import android.view.ContextThemeWrapper;

import abi10_0_0.com.facebook.react.ReactRootView;
import host.exp.expoview.R;

public class ReactUnthemedRootView extends ReactRootView {
  public ReactUnthemedRootView(Context context) {
    super(new ContextThemeWrapper(
        context,
        R.style.Theme_Exponent_None
    ));
  }
}
