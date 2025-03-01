package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.ComposeView
import expo.modules.kotlin.AppContext
import androidx.compose.ui.InternalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.viewinterop.AndroidView

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

  var children = mutableStateOf(listOf<ChildElement>())

  override fun addView(child: View?, index: Int) {
    when (child) {
      is ComposeView -> super.addView(child, index)
      is ExpoComposeView<*> -> {
        val composableContent = child.content
        if (composableContent is ComposableWrapper) {
          children.value += ChildElement.Compose { composableContent.composable() }
        }
      }
      null -> return
      else -> {
        children.value += ChildElement.Android(child)
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
    this.content = ComposableWrapper(content)
    layout.setContent { content() }
  }
}

class ComposableWrapper(val composable: @Composable () -> Unit)

sealed class ChildElement {
  data class Android(val view: View) : ChildElement()
  data class Compose(val content: @Composable () -> Unit) : ChildElement()
}

@Composable
fun ExpoComposeView<*>.Children(
  children: List<ChildElement>? = null
) {
  val childrenToRender = children ?: this.children.value
  childrenToRender.forEach { element ->
    when (element) {
      is ChildElement.Android -> AndroidView(
        modifier = Modifier.fillMaxWidth(),
        factory = { _ ->
          element.view.apply {
            layoutParams = ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)
          }
        },
      )
      is ChildElement.Compose -> element.content()
    }
  }
}
