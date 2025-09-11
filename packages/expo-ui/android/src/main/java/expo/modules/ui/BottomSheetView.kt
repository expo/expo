package expo.modules.ui

import android.content.Context
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.core.view.size
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import java.io.Serializable

open class IsOpenedChangeEvent(
  @Field open val isOpened: Boolean = false
) : Record, Serializable

data class BottomSheetProps(
  val isOpened: MutableState<Boolean> = mutableStateOf(false),
  val skipPartiallyExpanded: MutableState<Boolean> = mutableStateOf(false),
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetComposable(skipPartiallyExpanded: Boolean, isOpened: Boolean, onIsOpenedChange: (Boolean) -> Unit, content: @Composable () -> Unit) {
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded)

  if (isOpened) {
    ModalBottomSheet(
      sheetState = sheetState,
      modifier = Modifier.fillMaxHeight(),
      onDismissRequest = { onIsOpenedChange(false) },
    ) {
      content()
    }
  }
}

class BottomSheetView(context: Context, appContext: AppContext) :
  ExpoComposeView<BottomSheetProps>(context, appContext, withHostingView = true) {
  override val props = BottomSheetProps()
  private val onIsOpenedChange by EventDispatcher<IsOpenedChangeEvent>()

  @Composable
  override fun Content(modifier: Modifier) {
    val (isOpened) = props.isOpened
    val (skipPartiallyExpanded) = props.skipPartiallyExpanded

    Box {
      BottomSheetComposable(
        skipPartiallyExpanded,
        isOpened,
        onIsOpenedChange = { value -> onIsOpenedChange(IsOpenedChangeEvent(value)) },
      ) {
        ComposeChildren()
      }
    }
  }
}
