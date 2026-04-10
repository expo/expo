@file:OptIn(ExperimentalMaterial3Api::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.ModalBottomSheetProperties
import androidx.compose.material3.contentColorFor
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.AsyncFunctionHandle
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import kotlinx.coroutines.withContext
import kotlin.coroutines.cancellation.CancellationException

@OptimizedRecord
data class ModalBottomSheetPropertiesRecord(
  @Field val shouldDismissOnBackPress: Boolean = true,
  @Field val shouldDismissOnClickOutside: Boolean = true
) : Record

@OptimizedComposeProps
data class ModalBottomSheetViewProps(
  val skipPartiallyExpanded: Boolean = false,
  val containerColor: Color? = null,
  val contentColor: Color? = null,
  val scrimColor: Color? = null,
  val showDragHandle: Boolean = true,
  val sheetGesturesEnabled: Boolean = true,
  val properties: ModalBottomSheetPropertiesRecord = ModalBottomSheetPropertiesRecord(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ModalBottomSheetContent(
  props: ModalBottomSheetViewProps,
  hide: AsyncFunctionHandle<Unit>,
  expand: AsyncFunctionHandle<Unit>,
  partialExpand: AsyncFunctionHandle<Unit>,
  onDismissRequest: () -> Unit
) {
  val sheetState = rememberModalBottomSheetState(props.skipPartiallyExpanded)
  val scope = rememberCoroutineScope()

  hide.handle {
    try {
      withContext(scope.coroutineContext) {
        sheetState.hide()
      }
    } catch (_: CancellationException) {
      // Swipe-dismiss may cancel the coroutine scope while hide() is in-flight.
      // Swallowing the exception avoids an unhandled promise rejection on the JS side.
    }
  }

  expand.handle {
    try {
      withContext(scope.coroutineContext) {
        sheetState.expand()
      }
    } catch (_: CancellationException) {
      // Swipe-dismiss may cancel the coroutine scope while expand() is in-flight.
      // Swallowing the exception avoids an unhandled promise rejection on the JS side.
    }
  }

  partialExpand.handle {
    try {
      withContext(scope.coroutineContext) {
        sheetState.partialExpand()
      }
    } catch (_: CancellationException) {
      // Swipe-dismiss may cancel the coroutine scope while partialExpand() is in-flight.
      // Swallowing the exception avoids an unhandled promise rejection on the JS side.
    }
  }
 
  val resolvedContainerColor = props.containerColor.composeOrNull ?: BottomSheetDefaults.ContainerColor
  val resolvedContentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor)
  val resolvedScrimColor = props.scrimColor.composeOrNull ?: BottomSheetDefaults.ScrimColor
  val dragHandleSlotView = findChildSlotView(view, "dragHandle")

  ModalBottomSheet(
    sheetState = sheetState,
    onDismissRequest = onDismissRequest,
    containerColor = resolvedContainerColor,
    contentColor = resolvedContentColor,
    scrimColor = resolvedScrimColor,
    sheetGesturesEnabled = props.sheetGesturesEnabled,
    dragHandle = when {
      dragHandleSlotView != null -> {
        { with(UIComposableScope()) { with(dragHandleSlotView) { Content() } } }
      }
      props.showDragHandle -> {
        { BottomSheetDefaults.DragHandle() }
      }
      else -> null
    },
    properties = ModalBottomSheetProperties(
      shouldDismissOnBackPress = props.properties.shouldDismissOnBackPress,
      shouldDismissOnClickOutside = props.properties.shouldDismissOnClickOutside
    ),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope(), filter = { !isSlotView(it) })
  }
}
