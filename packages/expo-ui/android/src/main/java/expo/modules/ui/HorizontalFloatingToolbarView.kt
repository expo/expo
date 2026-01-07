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
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.button.ButtonPressedEvent

enum class HorizontalFloatingToolbarVariant(val value: String) : Enumerable {
  STANDARD("standard"),
  VIBRANT("vibrant"),
}

data class HorizontalFloatingToolbarProps(
  val variant: MutableState<HorizontalFloatingToolbarVariant?> =
    mutableStateOf(HorizontalFloatingToolbarVariant.STANDARD),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

data class FloatingActionButtonProps(
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class FloatingActionButtonView(context: Context, appContext: AppContext) :
  ExpoComposeView<FloatingActionButtonProps>(context, appContext) {
  override val props = FloatingActionButtonProps()
  internal val onButtonPressed by EventDispatcher<ButtonPressedEvent>()

  @Composable
  override fun ComposableScope.Content() {
    Children(this)
  }
}

@SuppressLint("ViewConstructor")
class HorizontalFloatingToolbarView(context: Context, appContext: AppContext) :
  ExpoComposeView<HorizontalFloatingToolbarProps>(context, appContext) {
  override val props = HorizontalFloatingToolbarProps()

  @OptIn(ExperimentalMaterial3ExpressiveApi::class)
  @Composable
  override fun ComposableScope.Content() {
    val boxScope = requireNotNull(this.boxScope)

    val colors = when (props.variant.value) {
      HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.vibrantFloatingToolbarColors()
      else -> FloatingToolbarDefaults.standardFloatingToolbarColors()
    }

    val floatingToolbarView = findFloatingActionButtonView()
    val floatingActionButtonOnClick: () -> Unit = {
      floatingToolbarView?.onButtonPressed?.invoke(ButtonPressedEvent())
    }
    val floatingActionButton = @Composable {
      when (props.variant.value) {
        HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.VibrantFloatingActionButton(
          floatingActionButtonOnClick
        ) {
          Children(this@Content, filter = { isFloatingActionButtonView(it) })
        }

        else -> FloatingToolbarDefaults.StandardFloatingActionButton(floatingActionButtonOnClick) {
          Children(this@Content, filter = { isFloatingActionButtonView(it) })
        }
      }
    }

    with(boxScope) {
      HorizontalFloatingToolbar(
        expanded = true,
        colors = colors,
        modifier = Modifier
          .fromExpoModifiers(props.modifiers.value, this@Content)
          .then(Modifier.align(Alignment.BottomCenter).offset(y = (-16).dp)), // FIXME
        floatingActionButton = floatingActionButton,
      ) {
        Children(this@Content, filter = { !isFloatingActionButtonView(it) })
      }
    }
  }

  private fun isFloatingActionButtonView(view: ExpoComposeView<*>): Boolean {
    return view is FloatingActionButtonView
  }

  private fun findFloatingActionButtonView(): FloatingActionButtonView? {
    for (index in 0..<this.size) {
      val child = getChildAt(index) as? FloatingActionButtonView
      if (child != null) {
        return child
      }
    }
    return null
  }
}
