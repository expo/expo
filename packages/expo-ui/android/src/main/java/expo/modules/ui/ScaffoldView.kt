package expo.modules.ui

import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FabPosition
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class ScaffoldViewProps(
  val hasTopBar: MutableState<Boolean> = mutableStateOf(false),
  val hasBottomBar: MutableState<Boolean> = mutableStateOf(false),
  val hasFloatingActionButton: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

class ScaffoldView(context: Context, appContext: AppContext) :
  ExpoComposeView<ScaffoldViewProps>(context, appContext) {
  override val props = ScaffoldViewProps()

  @Composable
  override fun ComposableScope.Content() {
    Scaffold(
      topBar = { if (props.hasTopBar.value) Child(0) },
      bottomBar = { if (props.hasBottomBar.value) Child(1) },
      floatingActionButton = { if (props.hasFloatingActionButton.value) Child(2) },
      floatingActionButtonPosition = FabPosition.End,
    ) { innerPadding ->
      Box(Modifier.fillMaxSize().padding(innerPadding)) {
        Child(3)
      }
    }
  }
}
