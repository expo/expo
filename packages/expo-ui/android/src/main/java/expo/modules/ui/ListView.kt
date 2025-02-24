package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.core.view.children
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

class ListView(context: Context, appContext: AppContext) : ExpoComposeView<ComposeProps>(context, appContext) {
  init {
    setContent {
      Column {
        children
      }
    }
  }
}