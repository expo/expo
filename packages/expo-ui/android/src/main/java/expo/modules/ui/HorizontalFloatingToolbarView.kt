package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.layout.offset
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FloatingToolbarDefaults
import androidx.compose.material3.HorizontalFloatingToolbar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class HorizontalFloatingToolbarProps(
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class HorizontalFloatingToolbarView(context: Context, appContext: AppContext) :
  ExpoComposeView<HorizontalFloatingToolbarProps>(context, appContext) {
  override val props = HorizontalFloatingToolbarProps()

  @OptIn(ExperimentalMaterial3ExpressiveApi::class)
  @Composable
  override fun ComposableScope.Content() {
    val boxScope = requireNotNull(this.boxScope)
    with(boxScope) {
      HorizontalFloatingToolbar(
        expanded = true,
        colors = FloatingToolbarDefaults.vibrantFloatingToolbarColors(),
//      modifier = Modifier.fromExpoModifiers(props.modifiers.value, this@Content)
        modifier = Modifier.align(Alignment.BottomCenter).offset(y = (-16).dp),
      ) {
        Children(this@Content)
      }
    }
  }
}
