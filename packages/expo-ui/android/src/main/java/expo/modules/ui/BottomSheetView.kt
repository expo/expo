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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class ModalBottomSheetPropertiesRecord(
  @Field val shouldDismissOnBackPress: Boolean = true,
  @Field val shouldDismissOnClickOutside: Boolean = true
) : Record

data class ModalBottomSheetProps(
  val isPresented: Boolean = true,
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
  props: ModalBottomSheetProps,
  onIsPresentedChange: (Boolean) -> Unit
) {
  val sheetState = rememberModalBottomSheetState(props.skipPartiallyExpanded)
  var showSheet by remember { mutableStateOf(props.isPresented) }

  // Animate hide when isPresented changes to false
  LaunchedEffect(props.isPresented) {
    if (props.isPresented) {
      showSheet = true
    } else {
      sheetState.hide()
      showSheet = false
      onIsPresentedChange(false)
    }
  }

  if (!showSheet) return

  val resolvedContainerColor = props.containerColor.composeOrNull ?: BottomSheetDefaults.ContainerColor
  val resolvedContentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor)
  val resolvedScrimColor = props.scrimColor.composeOrNull ?: BottomSheetDefaults.ScrimColor
  val dragHandleSlotView = findChildSlotView(view, "dragHandle")

  ModalBottomSheet(
    sheetState = sheetState,
    onDismissRequest = {
      showSheet = false
      onIsPresentedChange(false)
    },
    containerColor = resolvedContainerColor,
    contentColor = resolvedContentColor,
    scrimColor = resolvedScrimColor,
    sheetGesturesEnabled = props.sheetGesturesEnabled,
    dragHandle = when {
      dragHandleSlotView != null -> {
        { with(ComposableScope()) { with(dragHandleSlotView) { Content() } } }
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
    Children(ComposableScope(), filter = { !isSlotView(it) })
  }
}
