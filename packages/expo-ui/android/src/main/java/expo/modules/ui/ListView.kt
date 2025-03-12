package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.Children
import expo.modules.kotlin.views.ComposeProps

data class ListProps(
  val title: MutableState<String> = mutableStateOf("")
): ComposeProps()

class ListView(context: Context, appContext: AppContext) : ExpoComposeView<ListProps>(context, appContext) {
  override val props = ListProps()

  init {
    setContent {
      DynamicTheme {
        Column {
         Children()
        }
      }
    }
  }
}
