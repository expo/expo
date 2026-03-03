package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.viewinterop.AndroidView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.RNHostViewInterface

internal data class RNHostViewProps(
  val matchContents: MutableState<Boolean?> = mutableStateOf(null)
) : ComposeProps

@SuppressLint("ViewConstructor")
internal class RNHostView(context: Context, appContext: AppContext) :
  ExpoComposeView<RNHostViewProps>(context, appContext) {
  override val props = RNHostViewProps()

  private var childView: View? = null

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    childView = child
    super.addView(child, index, params)
  }

  @Composable
  override fun ComposableScope.Content() {
    val matchContents = props.matchContents.value ?: false

    childView?.let { view ->
      if (matchContents) {
        AndroidView(
          factory = { view },
          modifier = applySizeFromYogaNodeModifier(view)
        )
      } else {
        AndroidView(
          factory = { view },
          modifier = Modifier
            .fillMaxSize()
            .then(reportSizeToYogaNodeModifier())
        )
      }
    }
  }

  // Sets Compose view size from Yoga node size
  // Listens yoga node size changes and updates the Compose view size
  @Composable
  private fun applySizeFromYogaNodeModifier(childView: View): Modifier {
    val density = LocalDensity.current

    val childSize = remember {
      mutableStateOf(
        if (childView.width > 0 && childView.height > 0) IntSize(childView.width, childView.height)
        else IntSize.Zero
      )
    }

    DisposableEffect(childView) {
      val listener = View.OnLayoutChangeListener { _, l, t, r, b, _, _, _, _ ->
        childSize.value = IntSize(r - l, b - t)
      }
      childView.addOnLayoutChangeListener(listener)
      onDispose { childView.removeOnLayoutChangeListener(listener) }
    }

    return with(density) {
      if (childSize.value.width > 0 && childSize.value.height > 0) {
        Modifier.requiredSize(
          childSize.value.width.toDp(),
          childSize.value.height.toDp()
        )
      } else {
        Modifier
      }
    }
  }

  // Sets Yoga node size from Compose view size
  // Listens Compose view size changes and updates the Yoga node size
  @Composable
  private fun reportSizeToYogaNodeModifier(): Modifier {
    val density = LocalDensity.current
    return Modifier.onSizeChanged { size ->
      with(density) {
        shadowNodeProxy.setViewSize(
          size.width.toDp().value.toDouble(),
          size.height.toDp().value.toDouble()
        )
      }
    }
  }
}
