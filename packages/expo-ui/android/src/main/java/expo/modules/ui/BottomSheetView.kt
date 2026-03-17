@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.ModalBottomSheetProperties
import androidx.compose.material3.SheetState
import androidx.compose.material3.contentColorFor
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.withContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class ModalBottomSheetPropertiesRecord(
  @Field val shouldDismissOnBackPress: Boolean = true,
  @Field val shouldDismissOnClickOutside: Boolean = true
) : Record

data class ModalBottomSheetViewProps(
  val skipPartiallyExpanded: MutableState<Boolean> = mutableStateOf(false),
  val containerColor: MutableState<Color?> = mutableStateOf(null),
  val contentColor: MutableState<Color?> = mutableStateOf(null),
  val scrimColor: MutableState<Color?> = mutableStateOf(null),
  val showDragHandle: MutableState<Boolean> = mutableStateOf(true),
  val sheetGesturesEnabled: MutableState<Boolean> = mutableStateOf(true),
  val properties: MutableState<ModalBottomSheetPropertiesRecord> = mutableStateOf(ModalBottomSheetPropertiesRecord()),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class ModalBottomSheetView(context: Context, appContext: AppContext) :
  ExpoComposeView<ModalBottomSheetViewProps>(context, appContext) {
  override val props = ModalBottomSheetViewProps()
  internal val onDismissRequest by EventDispatcher<Unit>()

  internal var sheetState: SheetState? = null
  private var composeScope: CoroutineScope? = null

  suspend fun hide() {
    val scope = composeScope ?: return
    val state = sheetState ?: return
    withContext(scope.coroutineContext) {
      state.hide()
    }
  }

  @Composable
  override fun ComposableScope.Content() {
    val sheetState = rememberModalBottomSheetState(props.skipPartiallyExpanded.value)
    val scope = rememberCoroutineScope()
    this@ModalBottomSheetView.sheetState = sheetState
    this@ModalBottomSheetView.composeScope = scope

    val resolvedContainerColor = props.containerColor.value.composeOrNull ?: BottomSheetDefaults.ContainerColor
    val resolvedContentColor = props.contentColor.value.composeOrNull ?: contentColorFor(resolvedContainerColor)
    val resolvedScrimColor = props.scrimColor.value.composeOrNull ?: BottomSheetDefaults.ScrimColor
    val dragHandleSlotView = findChildSlotView(this@ModalBottomSheetView, "dragHandle")

    ModalBottomSheet(
      sheetState = sheetState,
      onDismissRequest = {
        onDismissRequest(Unit)
      },
      containerColor = resolvedContainerColor,
      contentColor = resolvedContentColor,
      scrimColor = resolvedScrimColor,
      sheetGesturesEnabled = props.sheetGesturesEnabled.value,
      dragHandle = when {
        dragHandleSlotView != null -> {
          { with(ComposableScope()) { with(dragHandleSlotView) { Content() } } }
        }
        props.showDragHandle.value -> {
          { BottomSheetDefaults.DragHandle() }
        }
        else -> null
      },
      properties = ModalBottomSheetProperties(
        shouldDismissOnBackPress = props.properties.value.shouldDismissOnBackPress,
        shouldDismissOnClickOutside = props.properties.value.shouldDismissOnClickOutside
      ),
      modifier = ModifierRegistry.applyModifiers(props.modifiers.value, appContext, this@Content, globalEventDispatcher)
    ) {
      Children(ComposableScope(), filter = { !isSlotView(it) })
    }
  }
}
