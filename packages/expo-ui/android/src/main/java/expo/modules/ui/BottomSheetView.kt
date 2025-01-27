package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SheetState
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.core.view.children
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps

data class BottomSheetProps(
  val open: MutableState<Boolean> = mutableStateOf(false),
) : ComposeProps()

@OptIn(ExperimentalMaterial3Api::class)
class BottomSheetView(context: Context, appContext: AppContext) : ExpoComposeView<BottomSheetProps>(context, appContext) {
  override val props = BottomSheetProps()
  private val onSheetClosed by EventDispatcher()
  init {
    setContent {
      val (open) = props.open
      val sheetState = rememberModalBottomSheetState()


      ModalBottomSheet(
        onDismissRequest = {
          onSheetClosed(emptyMap())
        },
        Modifier.onSizeChanged { size ->
          println("Size changed ${size}")
        },

        sheetState = sheetState
      ) {

        // Sheet content
        Box(modifier = Modifier
          .onGloballyPositioned { coordinates ->
            // Set column height using the LayoutCoordinates
            println(coordinates.size.height.toFloat())
          }) {
          Children()
        }

      }
    }
  }
}
