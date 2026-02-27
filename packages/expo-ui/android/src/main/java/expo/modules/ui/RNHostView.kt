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
import android.util.Log
import expo.modules.kotlin.views.ExpoComposeView

internal data class RNHostProps(
  val matchContents: MutableState<Boolean?> = mutableStateOf(null)
) : ComposeProps

@SuppressLint("ViewConstructor")
internal class RNHostView(context: Context, appContext: AppContext) :
  ExpoComposeView<RNHostProps>(context, appContext) {
  override val props = RNHostProps()

  private var childView: View? = null

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    childView = child
    super.addView(child, index, params)
  }

  @Composable
  override fun ComposableScope.Content() {
    val matchContents = props.matchContents.value ?: false
    val density = LocalDensity.current

    val sizeModifier = Modifier.onSizeChanged { size ->
      with(density) {
        val widthDp = size.width.toDp().value.toDouble()
        val heightDp = size.height.toDp().value.toDouble()
        if (matchContents) {
          shadowNodeProxy.setStyleSize(widthDp, heightDp)
        } else {
          Log.d("RNHostView", "setViewSize: $widthDp, $heightDp")
          shadowNodeProxy.setViewSize(widthDp, heightDp)
        }
      }
    }

    if (matchContents) {
      childView?.let { view ->
        // Seed with the child's current Yoga-set dimensions so requiredSize
        // is applied from the very first composition
        val childSize = remember {
          mutableStateOf(
            if (view.width > 0 && view.height > 0) IntSize(view.width, view.height)
            else IntSize.Zero
          )
        }

        DisposableEffect(view) {
          // Observe the child's Yoga-set dimensions reactively.
          // When Yoga re-layouts the child, the listener fires, updating Compose state,
          // which triggers recomposition with the correct requiredSize.
          val listener = View.OnLayoutChangeListener { _, l, t, r, b, _, _, _, _ ->
            childSize.value = IntSize(r - l, b - t)
          }
          view.addOnLayoutChangeListener(listener)
          onDispose { view.removeOnLayoutChangeListener(listener) }
        }

        val yogaSizeModifier = with(density) {
          if (childSize.value.width > 0 && childSize.value.height > 0) {
            Modifier.requiredSize(
              childSize.value.width.toDp(),
              childSize.value.height.toDp()
            )
          } else {
            Modifier
          }
        }

        AndroidView(
          factory = { view },
          modifier = yogaSizeModifier.then(sizeModifier)
        )
      }
    } else {
      // so the children with flex: 1 can expand.
      childView?.let { view ->
        AndroidView(
          factory = { view },
          modifier = Modifier.fillMaxSize().then(sizeModifier)
        )
      }
    }
  }
}
