// Copyright 2015-present 650 Industries. All rights reserved.
package abi49_0_0.host.exp.exponent

import android.content.Context
import android.view.ContextThemeWrapper
import host.exp.expoview.R
import abi49_0_0.com.facebook.react.ReactRootView

class ReactUnthemedRootView(context: Context?) : ReactRootView(
  ContextThemeWrapper(
    context,
    R.style.Theme_Exponent_None
  )
)
