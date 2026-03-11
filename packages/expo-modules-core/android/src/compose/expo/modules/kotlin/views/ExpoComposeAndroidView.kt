package expo.modules.kotlin.views

import android.annotation.SuppressLint
import android.view.View
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.facebook.react.uimanager.PixelUtil.pxToDp
import expo.modules.kotlin.AppContext

/**
 * Marks a view as capable of crossing the Jetpack Compose -> React Native boundary.
 */
interface RNHostViewInterface {
  var matchContents: Boolean
}

/**
 * An ExpoComposeView for [AndroidView] wrapping with existing view
 */
@SuppressLint("ViewConstructor")
internal class ExpoComposeAndroidView(
  private val view: View,
  appContext: AppContext
) : ExpoComposeView<ComposeProps>(view.context, appContext), RNHostViewInterface {
  override var matchContents = false

  @Composable
  override fun ComposableScope.Content() {
    AndroidView(
      factory = { view },
      modifier = Modifier.size(
        view.width.toFloat().pxToDp().dp,
        view.height.toFloat().pxToDp().dp
      )
    )
  }
}
