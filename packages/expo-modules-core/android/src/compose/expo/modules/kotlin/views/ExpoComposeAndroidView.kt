package expo.modules.kotlin.views

import android.view.View
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.facebook.react.uimanager.PixelUtil.pxToDp
import expo.modules.kotlin.AppContext

/**
 * An ExpoComposeView for [AndroidView] wrapping with existing view
 */
internal class ExpoComposeAndroidView(private val view: View, appContext: AppContext) : ExpoComposeView<ComposeProps>(view.context, appContext) {
  @Composable
  override fun Content(modifier: Modifier) {
    AndroidView(
      factory = { view },
      modifier = Modifier.size(view.width.toFloat().pxToDp().dp, view.height.toFloat().pxToDp().dp)
    )
  }
}
