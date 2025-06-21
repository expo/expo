package expo.modules.ui

import android.content.Context
import android.util.Log
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import java.io.Serializable

open class IsOpenedChangeEvent(
  @Field open val isOpened: Boolean = false
) : Record, Serializable

data class BottomSheetProps(
  val isOpened: MutableState<Boolean> = mutableStateOf(false),
  ) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetComposable(isOpened: Boolean, onIsOpenedChange: (Boolean) -> Unit, content: @Composable () -> Unit) {
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
//  val scope = rememberCoroutineScope()

  Button(
    onClick = {
      Log.v("BottomSheetView", "showButton")
      onIsOpenedChange(true)
//      scope.launch { sheetState.show() }.invokeOnCompletion {
//        if (sheetState.isVisible) {
//          onIsOpenedChange(true)
//        }
//      }
    },
  ) {
    Text("Show bottom sheet")
  }

  if (isOpened) {
    ModalBottomSheet(
      sheetState = sheetState,
      modifier = Modifier.fillMaxHeight(),
      onDismissRequest = {
        Log.v("BottomSheetView", "onDismissRequest")
        onIsOpenedChange(false)
//        scope.launch { sheetState.hide() }.invokeOnCompletion {
//          if (!sheetState.isVisible) {
//            onIsOpenedChange(false)
//          }
//        }
      },
    ) {
      // Sheet content
//        content()
      Text("Content here")
    }
  }
}

class BottomSheetView(context: Context, appContext: AppContext) :
  ExpoComposeView<BottomSheetProps>(context, appContext, withHostingView = true) {
  override val props = BottomSheetProps()
  private val onValueChanged by EventDispatcher<IsOpenedChangeEvent>()

  @Composable
  override fun Content() {
    val (isOpened) = props.isOpened
    val onIsOpenedChange = fun(value: Boolean) {
      Log.v("BottomSheetView", "onIsOpenedChange")
      Log.v("BottomSheetView", value.toString())
      onValueChanged(IsOpenedChangeEvent(value))
    }

    AutoSizingComposable(shadowNodeProxy) {
      BottomSheetComposable(
        isOpened,
        onIsOpenedChange,
      ) {
        Children()
      }
    }
  }
}
