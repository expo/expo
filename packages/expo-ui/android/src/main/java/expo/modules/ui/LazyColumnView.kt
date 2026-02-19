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
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.convertibles.VerticalArrangement
import expo.modules.ui.convertibles.toComposeArrangement

data class ContentPadding(
  @Field val start: Int = 0,
  @Field val top: Int = 0,
  @Field val end: Int = 0,
  @Field val bottom: Int = 0
) : Record

data class LazyColumnProps(
  val verticalArrangement: MutableState<VerticalArrangement?> = mutableStateOf(null),
  val horizontalAlignment: MutableState<String?> = mutableStateOf(null),
  val contentPadding: MutableState<ContentPadding?> = mutableStateOf(null),
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

    val horizontalAlignment = when (props.horizontalAlignment.value) {
      "start" -> Alignment.Start
      "end" -> Alignment.End
      "center" -> Alignment.CenterHorizontally
      else -> Alignment.Start
    }

    val padding = props.contentPadding.value

    LazyColumn(
      modifier = ModifierRegistry.applyModifiers(props.modifiers.value, appContext, this@Content, globalEventDispatcher),
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
