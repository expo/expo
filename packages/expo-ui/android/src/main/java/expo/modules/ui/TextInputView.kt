package expo.modules.ui

import android.content.Context

import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView

import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.ComposeProps

import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue


data class TextInputProps(
  val value: MutableState<ValueBinding<String>> = mutableStateOf(ValueBinding("")),
) : ComposeProps


class TextInputView(context: Context, appContext: AppContext) : ExpoComposeView<TextInputProps>(context, appContext) {
  override val props = TextInputProps()

  init {
    setContent {
      val (livedata) = props.value
      val value: String by livedata.value.observeAsState("")
      TextField(
        value = value,
        onValueChange = { livedata.value.value = it },
      )
    }
  }
}
