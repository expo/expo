package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyRow
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableIntState
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.currentRecomposeScope
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.convertibles.HorizontalArrangement
import expo.modules.ui.convertibles.VerticalAlignment
import expo.modules.ui.convertibles.toComposeArrangement
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class LazyRowProps(
  val horizontalArrangement: MutableState<HorizontalArrangement?> = mutableStateOf(null),
  val verticalAlignment: MutableState<VerticalAlignment?> = mutableStateOf(null),
  val contentPadding: MutableState<ContentPadding?> = mutableStateOf(null),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class LazyRowView(context: Context, appContext: AppContext) :
  ExpoComposeView<LazyRowProps>(context, appContext) {
  override val props = LazyRowProps()

  private val composableChildCount: MutableIntState = mutableIntStateOf(0)

  override fun onViewAdded(child: View?) {
    super.onViewAdded(child)
    composableChildCount.intValue = childCount
  }

  override fun onViewRemoved(child: View?) {
    super.onViewRemoved(child)
    composableChildCount.intValue = childCount
  }

  @Composable
  override fun ComposableScope.Content() {
    recomposeScope = currentRecomposeScope
    val horizontalArrangement = props.horizontalArrangement.value?.toComposeArrangement() ?: Arrangement.Start

    val verticalAlignment = props.verticalAlignment.value?.toComposeAlignment() ?: Alignment.Top

    val padding = props.contentPadding.value

    LazyRow(
      modifier = ModifierRegistry.applyModifiers(props.modifiers.value, appContext, this@Content, globalEventDispatcher),
      horizontalArrangement = horizontalArrangement,
      verticalAlignment = verticalAlignment,
      contentPadding = PaddingValues(
        start = (padding?.start ?: 0).dp,
        top = (padding?.top ?: 0).dp,
        end = (padding?.end ?: 0).dp,
        bottom = (padding?.bottom ?: 0).dp
      )
    ) {
      val count = composableChildCount.intValue
      for (index in 0..<count) {
        val child = getChildAt(index) as? ExpoComposeView<*> ?: continue
        item {
          with(this@Content) {
            with(child) {
              Content()
            }
          }
        }
      }
    }
  }
}
