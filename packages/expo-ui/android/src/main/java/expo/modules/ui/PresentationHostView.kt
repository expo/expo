package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.runtime.Composable
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
  HostView(context, appContext) {
  // Attached to the activity current at mount, as `ReactModalHostView` does. Without one, this view
  // renders its children inline like a `HostView`. React Native adds the children after this init,
  // so none need to move.
  private val presentationRoot: PresentationRootView? =
    appContext.currentActivity?.findViewById<ViewGroup>(android.R.id.content)?.let { content ->
      PresentationRootView(context, appContext, this).also {
        content.addView(it, FrameLayout.LayoutParams(0, 0))
      }
    }

  internal val childContainer: ViewGroup
    get() = presentationRoot ?: this

  override val rendersChildren: Boolean
    get() = presentationRoot == null

  // Like React Native's `Modal`, an open sheet closes at once when React Native drops this view,
  // for example when its screen pops.
  override fun disposeHostedComposition() {
    // The root stays the child container, as React Native may still remove children after this.
    presentationRoot?.let {
      // Detach first: the composition is only disposed once its view has left the window.
      (it.parent as? ViewGroup)?.removeView(it)
      it.disposeHostedComposition()
    }
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
