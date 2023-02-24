package com.reactnativepagerview

import android.content.Context
import android.content.ContextWrapper
import android.view.View
import com.facebook.react.bridge.ReactContext


class Helper {
    companion object {
        // https://github.com/facebook/react-native/blob/v0.64.2/ReactAndroid/src/main/java/com/facebook/react/uimanager/UIManagerHelper.java#L138
        fun getReactContext(view: View): ReactContext? {
            var context: Context = view.getContext()
            if (context !is ReactContext && context is ContextWrapper) {
                context = context.baseContext
            }
            return if (context is ReactContext) context else null;
        }
    }

}