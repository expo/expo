package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

/**
 * A [HostView] for content that presents in its own window, like a modal sheet. Like React Native's
 * `Modal`, its children live in a root attached to the activity, so where this view sits, its size,
 * or a list clipping it can't affect them.
 */
@SuppressLint("ViewConstructor")
internal class PresentationHostView(context: Context, appContext: AppContext) :
  HostView(context, appContext), LifecycleEventListener {
  private var presentationRoot: PresentationRootView? = null

  internal val childContainer: ViewGroup
    get() = presentationRoot ?: this

  override val rendersChildren: Boolean
    get() = presentationRoot == null

  init {
    (context as? ReactContext)?.addLifecycleEventListener(this)
    attachPresentationRoot()
  }

  // Without an activity the children stay here, and the root is attached once the host resumes.
  private fun attachPresentationRoot() {
    if (presentationRoot != null) {
      return
    }
    val content = appContext.currentActivity?.findViewById<ViewGroup>(android.R.id.content) ?: return
    val root = PresentationRootView(context, appContext, this)
    val children = (0 until childCount).map(::getChildAt).filter { it !is ComposeView }
    children.forEach {
      removeView(it)
      // Before the root's own ComposeView, which stays last as in a HostView.
      root.addView(it, root.childCount - 1)
    }
    content.addView(root, FrameLayout.LayoutParams(0, 0))
    presentationRoot = root
    recomposeScope?.invalidate()
  }

  override fun onHostResume() {
    attachPresentationRoot()
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  override fun disposeHostedComposition() {
    (context as? ReactContext)?.removeLifecycleEventListener(this)
    presentationRoot?.let {
      // Detach first: the composition is only disposed once its view has left the window.
      (it.parent as? ViewGroup)?.removeView(it)
      it.disposeHostedComposition()
    }
    presentationRoot = null
    super.disposeHostedComposition()
  }
}

/**
 * Where a [PresentationHostView] mounts its children, like the dialog root of React Native's `Modal`.
 */
@SuppressLint("ViewConstructor")
internal class PresentationRootView(
  context: Context,
  appContext: AppContext,
  private val host: HostView
) : ExpoComposeView<ComposeProps>(context, appContext, withHostingView = true) {
  @Composable
  override fun ComposableScope.Content() {
    host.HostTheme {
      Children(this@Content)
    }
  }
}
