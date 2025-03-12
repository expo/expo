package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.ComposeView
import expo.modules.kotlin.AppContext
import androidx.compose.ui.InternalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.children
import com.facebook.react.views.view.ReactViewGroup

/**
 * A base class that should be used by compose views.
 */
abstract class ExpoComposeView<T : ComposeProps>(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext) {
  open val props: T? = null

  override val shouldUseAndroidLayout = true

  var content: Any? = null

  override fun addView(child: View?, index: Int) {
    println("adding view: $child")
    when (child) {
      is ComposeView -> super.addView(child, index)
      is ExpoComposeView<*> -> {
        val composableContent = child.content
        if (composableContent is ComposableWrapper) {
          props?.let {
            val composeChild = ComposableChild.Compose { composableContent.composable() }
            it._children.value += composeChild
          }
        }
      }

      null -> return
      else -> {
        props?.let {
          it._children.value += ComposableChild.Android(child)
        }
      }
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // In case of issues there's an alternative solution in previous commits at https://github.com/expo/expo/pull/33759
    if (!isAttachedToWindow) {
      setMeasuredDimension(widthMeasureSpec, heightMeasureSpec)
      return
    }
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  @OptIn(InternalComposeUiApi::class)
  val layout by lazy {
    ComposeView(context).also {
      it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      it.setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
      addView(it)
      it.addOnAttachStateChangeListener(object : OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: View) {
          it.disposeComposition()
        }

        override fun onViewDetachedFromWindow(v: View) = Unit
      })
    }
  }

  fun setContent(
    content: @Composable () -> Unit
  ) {
    layout.children
    this.content = ComposableWrapper(content)
    layout.setContent { content() }
  }
}

class ComposableWrapper(val composable: @Composable () -> Unit)

sealed class ComposableChild {
  data class Android(val view: View) : ComposableChild()
  data class Compose(val content: @Composable () -> Unit) : ComposableChild()
}

@Composable
fun ExpoComposeView<*>.Children(
  children: List<ComposableChild>? = null
) {
  val childrenToRender = children ?: props?._children?.value.orEmpty()
  childrenToRender.forEach { element ->
    when (element) {
      is ComposableChild.Android -> AndroidView(
        modifier = Modifier.fillMaxWidth(),
        factory = { _ ->
          element.view.apply {
            layoutParams = ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)
          }
        },
      )
      is ComposableChild.Compose -> element.content()
    }
  }
}
