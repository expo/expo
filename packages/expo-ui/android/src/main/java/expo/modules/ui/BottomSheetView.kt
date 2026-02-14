package expo.modules.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetValue
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import kotlinx.coroutines.flow.drop
import java.io.Serializable

open class IsOpenedChangeEvent(
  @Field open val isOpened: Boolean = false
) : Record, Serializable

open class SelectedDetentChangeEvent(
  @Field open val selectedDetentIndex: Int = 0
) : Record, Serializable

data class DetentConfig(
  val skipPartiallyExpanded: Boolean,
  val sheetModifier: Modifier,
  val contentModifier: Modifier
)

fun parseDetent(detent: Any?, screenHeightDp: Float): DetentConfig {
  val defaultSheetModifier = Modifier.fillMaxHeight()
  return when (detent) {
    "medium" -> DetentConfig(skipPartiallyExpanded = false, sheetModifier = defaultSheetModifier, contentModifier = Modifier)
    "large" -> DetentConfig(skipPartiallyExpanded = true, sheetModifier = defaultSheetModifier, contentModifier = Modifier.fillMaxHeight())
    is Map<*, *> -> {
      val fraction = (detent["fraction"] as? Number)?.toFloat()
      val height = (detent["height"] as? Number)?.toFloat()
      when {
        fraction != null -> DetentConfig(
          skipPartiallyExpanded = false,
          sheetModifier = defaultSheetModifier,
          contentModifier = Modifier.height((screenHeightDp * fraction).dp)
        )
        height != null -> DetentConfig(
          skipPartiallyExpanded = false,
          sheetModifier = defaultSheetModifier,
          contentModifier = Modifier.height(height.dp)
        )
        else -> DetentConfig(skipPartiallyExpanded = false, sheetModifier = defaultSheetModifier, contentModifier = Modifier)
      }
    }
    else -> DetentConfig(skipPartiallyExpanded = false, sheetModifier = defaultSheetModifier, contentModifier = Modifier)
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetComposable(
  skipPartiallyExpanded: Boolean,
  isOpened: Boolean,
  onIsOpenedChange: (Boolean) -> Unit,
  fitToContents: Boolean = false,
  detents: List<Any>? = null,
  selectedDetent: Any? = null,
  onSelectedDetentChange: ((Int) -> Unit)? = null,
  content: @Composable () -> Unit
) {
  val screenHeightDp = LocalConfiguration.current.screenHeightDp.toFloat()
  val detentConfig = if (fitToContents) {
    // No fillMaxHeight on sheet so it sizes to content; skip partial so it expands to content height
    DetentConfig(skipPartiallyExpanded = true, sheetModifier = Modifier, contentModifier = Modifier)
  } else {
    val activeDetent = selectedDetent ?: detents?.firstOrNull()
    if (activeDetent != null) {
      parseDetent(activeDetent, screenHeightDp)
    } else {
      DetentConfig(skipPartiallyExpanded = skipPartiallyExpanded, sheetModifier = Modifier.fillMaxHeight(), contentModifier = Modifier)
    }
  }

  val sheetState = rememberModalBottomSheetState(detentConfig.skipPartiallyExpanded)

  if (isOpened) {
    if (onSelectedDetentChange != null && detents != null && detents.size > 1) {
      LaunchedEffect(sheetState) {
        snapshotFlow { sheetState.currentValue }
          .drop(1)
          .collect { value ->
            val newDetentIndex = when (value) {
              SheetValue.PartiallyExpanded -> 0
              SheetValue.Expanded -> detents.size - 1
              else -> return@collect
            }
            onSelectedDetentChange(newDetentIndex)
          }
      }
    }

    ModalBottomSheet(
      sheetState = sheetState,
      modifier = detentConfig.sheetModifier,
      onDismissRequest = { onIsOpenedChange(false) }
    ) {
      Box(modifier = detentConfig.contentModifier) {
        content()
      }
    }
  }
}

data class BottomSheetProps(
  val isOpened: Boolean = false,
  val skipPartiallyExpanded: Boolean = false,
  val fitToContents: Boolean = false,
  val detents: List<Any>? = null,
  val selectedDetent: Any? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.BottomSheetContent(
  props: BottomSheetProps,
  onIsOpenedChange: (IsOpenedChangeEvent) -> Unit,
  onSelectedDetentChange: ((SelectedDetentChangeEvent) -> Unit)? = null
) {
  Box {
    BottomSheetComposable(
      props.skipPartiallyExpanded,
      props.isOpened,
      onIsOpenedChange = { value -> onIsOpenedChange(IsOpenedChangeEvent(value)) },
      fitToContents = props.fitToContents,
      detents = props.detents,
      selectedDetent = props.selectedDetent,
      onSelectedDetentChange = if (onSelectedDetentChange != null) {
        { index -> onSelectedDetentChange(SelectedDetentChangeEvent(index)) }
      } else {
        null
      }
    ) {
      Children(ComposableScope())
    }
  }
}
