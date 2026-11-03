package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableIntState
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.currentRecomposeScope
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.convertibles.HorizontalAlignment
import expo.modules.ui.convertibles.VerticalArrangement
import expo.modules.ui.convertibles.toComposeArrangement
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class ContentPadding(
  @Field val start: Int = 0,
  @Field val top: Int = 0,
  @Field val end: Int = 0,
  @Field val bottom: Int = 0
) : Record

@OptimizedComposeProps
data class LazyColumnProps(
  val verticalArrangement: MutableState<VerticalArrangement?> = mutableStateOf(null),
  val horizontalAlignment: MutableState<HorizontalAlignment?> = mutableStateOf(null),
  val contentPadding: MutableState<ContentPadding?> = mutableStateOf(null),
  val dismissKeyboardOnScroll: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class LazyColumnView(context: Context, appContext: AppContext) :
  ExpoComposeView<LazyColumnProps>(context, appContext) {
  override val props = LazyColumnProps()

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
    val verticalArrangement = props.verticalArrangement.value?.toComposeArrangement() ?: Arrangement.Top

    val horizontalAlignment = props.horizontalAlignment.value?.toComposeAlignment() ?: Alignment.Start

    val padding = props.contentPadding.value

    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    // Mirrors the iOS `scrollDismissesKeyboard("immediately")`: a user drag clears focus and hides the keyboard.
    val dismissKeyboardConnection = remember(focusManager, keyboardController) {
      object : NestedScrollConnection {
        override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
          if (source == NestedScrollSource.UserInput && available.y != 0f) {
            focusManager.clearFocus()
            keyboardController?.hide()
          }
          return Offset.Zero
        }
      }
    }
    val dismissKeyboardModifier =
      if (props.dismissKeyboardOnScroll.value) Modifier.nestedScroll(dismissKeyboardConnection) else Modifier

    LazyColumn(
      modifier = dismissKeyboardModifier
        .then(ModifierRegistry.applyModifiers(props.modifiers.value, appContext, this@Content, globalEventDispatcher))
        .lazyRecycledItemsCrossAxis(this@LazyColumnView, isVertical = true),
      verticalArrangement = verticalArrangement,
      horizontalAlignment = horizontalAlignment,
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
        if (child is LazyItemsView) {
          lazyRecycledItems(child, this@Content, isVertical = true)
          continue
        }
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
