package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.facebook.react.ReactRootView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.RNHostViewInterface
import expo.modules.kotlin.views.ShadowNodeProxy
import java.lang.ref.WeakReference

internal data class RNHostProps(
  val matchContents: MutableState<Boolean?> = mutableStateOf(null),
  val verticalScrollEnabled: MutableState<Boolean?> = mutableStateOf(null),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
internal class RNHostView(context: Context, appContext: AppContext)
  : ExpoComposeView<RNHostProps>(context, appContext), RNHostViewInterface {
  override val props = RNHostProps()
  override var matchContents: Boolean = false
    get() = props.matchContents.value ?: false

  private val container = RNHostContainerView(context, WeakReference(shadowNodeProxy))

  @Composable
  override fun ComposableScope.Content() {
    val (verticalScrollEnabled) = props.verticalScrollEnabled

    AndroidView(
      factory = {
        container
      },
      modifier = Modifier
        .fromExpoModifiers(props.modifiers.value, this@Content)
        .then(if (verticalScrollEnabled == true) Modifier.verticalScroll(rememberScrollState()) else Modifier),
    )
  }

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    container.addView(child, index, params)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    container.measure(widthMeasureSpec, heightMeasureSpec)
  }

  override fun onLayout(
    changed: Boolean,
    left: Int,
    top: Int,
    right: Int,
    bottom: Int
  ) {
    super.onLayout(changed, left, top, right, bottom)
    val offsetX = paddingLeft
    val offsetY = paddingRight
    container.layout(offsetX, offsetY, offsetX + width, offsetY + height)
  }
}

internal class RNHostContainerView(context: Context, private val shadowNodeProxy: WeakReference<ShadowNodeProxy>) : ReactRootView(context) {
  var matchContents = false

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (matchContents && childCount > 1) {
      val subview = getChildAt(0)
      shadowNodeProxy.get()?.setViewSize(subview.width.toDouble(), subview.height.toDouble())
    } else {
      shadowNodeProxy.get()?.setViewSize(width.toDouble(), height.toDouble())
    }
  }
}
