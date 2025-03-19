package expo.modules.kotlin.views

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.LinearLayout
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.currentRecomposeScope
import androidx.compose.ui.platform.ComposeView
import expo.modules.kotlin.AppContext
import androidx.compose.ui.InternalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.children
import com.facebook.react.bridge.ReadableMap
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

  var composeContent: (@Composable () -> Unit)? = null

  override fun addView(child: View?, index: Int) {
    when (child) {
      is ComposeView -> super.addView(child, index)
      null -> return
      else -> {
        props?.let {
          it.innerChildren.value = it.innerChildren.value.toMutableList().apply {
            add(index, child)
          }
        }
      }
    }
  }

  override fun removeViewAt(index: Int) {
    props?.let {
      it.innerChildren.value = it.innerChildren.value.filter { childElement ->
          it.innerChildren.value.indexOf(childElement) != index
      }
    }
  }

  override fun updateViewLayout(view: View, params: ViewGroup.LayoutParams) {
    print("updateViewLayout $view")
    super.updateViewLayout(view, params)
  }

  override fun removeView(view: View?) {
    print("removeView $view")
    super.removeView(view)
  }

  fun getComposeChildCount(): Int {
    return props?.innerChildren?.value?.size ?: 0
  }

  fun getComposeChildAt(index: Int): View {
    return props?.innerChildren?.value?.get(index)?.let { child ->
     child
    } ?: throw IndexOutOfBoundsException("No child at index $index")
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
    this.composeContent = content
    layout.setContent { content() }
  }
}

@Composable
fun ExpoComposeView<*>.Children(
  children: List<View>? = null
) {
  val childrenToRender = children ?: props?.innerChildren?.value.orEmpty()
  childrenToRender.forEach { element ->
   AndroidView(
    factory = { _ ->
      (element.parent as? ViewGroup)?.removeView(element)
      LinearLayout(context).apply {
        addView(element)
        layoutParams = LinearLayout.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)
      }
    },
  )
  }
}

@Composable
fun ExpoComposeView<*>.UnwrappedChildren(
  children: List<View>? = null
) {
  val childrenToRender = children ?: props?.innerChildren?.value.orEmpty()
  childrenToRender.forEach { element ->
    when (element) {
      is ExpoComposeView<*> -> element.composeContent?.invoke()
      else -> AndroidView(
        modifier = Modifier.fillMaxWidth(),
        factory = { _ ->
          (element.parent as? ViewGroup)?.removeView(element)
          element.apply {
            layoutParams = ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)
          }
        },
      )
    }
  }
}
