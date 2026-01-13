package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FloatingToolbarDefaults
import androidx.compose.material3.FloatingToolbarScrollBehavior
import androidx.compose.material3.HorizontalFloatingToolbar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

enum class HorizontalFloatingToolbarVariant(val value: String) : Enumerable {
  STANDARD("standard"),
  VIBRANT("vibrant"),
}

data class HorizontalFloatingToolbarProps(
  val variant: MutableState<HorizontalFloatingToolbarVariant?> =
    mutableStateOf(HorizontalFloatingToolbarVariant.STANDARD),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class HorizontalFloatingToolbarView(context: Context, appContext: AppContext) :
  ExpoComposeView<HorizontalFloatingToolbarProps>(context, appContext) {
  override val props = HorizontalFloatingToolbarProps()

  @OptIn(ExperimentalMaterial3ExpressiveApi::class)
  @Composable
  override fun ComposableScope.Content() {
    val colors = when (props.variant.value) {
      HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.vibrantFloatingToolbarColors()
      else -> FloatingToolbarDefaults.standardFloatingToolbarColors()
    }

    // Find the FAB slot and extract its onClick handler
    val fabSlotView = findChildSlotView(this@HorizontalFloatingToolbarView, "floatingActionButton")
    val fabOnClick: () -> Unit = {
      fabSlotView?.onSlotEvent?.invoke(Unit)
    }

    val floatingActionButton = @Composable {
      when (props.variant.value) {
        HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.VibrantFloatingActionButton(
          onClick = fabOnClick
        ) {
          Children(this@Content, filter = { isSlotWithName(it, "floatingActionButton") })
        }

        else -> FloatingToolbarDefaults.StandardFloatingActionButton(onClick = fabOnClick) {
          Children(this@Content, filter = { isSlotWithName(it, "floatingActionButton") })
        }
      }
    }

    val scrollBehavior = nestedScrollConnection as? FloatingToolbarScrollBehavior
    HorizontalFloatingToolbar(
      expanded = true,
      colors = colors,
      scrollBehavior = scrollBehavior,
      modifier = Modifier.fromExpoModifiers(props.modifiers.value, this@Content),
      floatingActionButton = floatingActionButton,
    ) {
      Children(this@Content, filter = { !isSlotView(it) })
    }
  }
}
