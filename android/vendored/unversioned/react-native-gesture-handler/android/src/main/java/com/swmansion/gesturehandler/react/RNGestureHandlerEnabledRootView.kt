package com.swmansion.gesturehandler.react

import android.content.Context
import android.util.AttributeSet
import com.facebook.react.ReactRootView

@Deprecated(message = "Use <GestureHandlerRootView /> component instead. Check gesture handler installation instructions in documentation for more information.")
class RNGestureHandlerEnabledRootView : ReactRootView {
  constructor(context: Context?) : super(context) {}
  constructor(context: Context?, attrs: AttributeSet?) : super(context, attrs) {}

  init {
    throw UnsupportedOperationException("Your application is configured to use RNGestureHandlerEnabledRootView which is no longer supported. You can see how to migrate to <GestureHandlerRootView /> here: https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot")
  }
}
