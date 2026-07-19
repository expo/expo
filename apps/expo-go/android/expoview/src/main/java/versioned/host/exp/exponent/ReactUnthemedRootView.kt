// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent

import android.content.Context
import android.view.ContextThemeWrapper
import host.exp.expoview.R
import com.facebook.react.ReactRootView

class ReactUnthemedRootView(context: Context?) : ReactRootView(
  ContextThemeWrapper(
    context,
    R.style.Theme_Exponent_None
  )
)
