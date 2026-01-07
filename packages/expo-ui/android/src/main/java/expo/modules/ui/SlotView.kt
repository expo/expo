package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class SlotProps(
  val slotName: MutableState<String> = mutableStateOf("")
) : ComposeProps

/**
 * A generic slot marker view that can be used to mark children for specific slots.
 * This view is not rendered directly but used as a marker to identify which children
 * should be placed in which composable slots.
 */
@SuppressLint("ViewConstructor")
class SlotView(context: Context, appContext: AppContext) :
  ExpoComposeView<SlotProps>(context, appContext) {
  override val props = SlotProps()
  internal val onSlotEvent by EventDispatcher<Unit>()

  @Composable
  override fun ComposableScope.Content() {
    Children(this)
  }
}
