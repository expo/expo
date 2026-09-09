package expo.modules.router

import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.core.widget.NestedScrollView

enum class ScrollViewPathViewKind {
  SCREEN,
  NAVIGATOR_HOST,
  OTHER
}

sealed class ScrollViewPathClassification {
  /** The first-child walk reaches a vertical scroll view, so scroll-to-top works. */
  object FirstChild : ScrollViewPathClassification()

  /** The first-child walk reaches another navigator, which owns its own scroll views. */
  object NestedNavigator : ScrollViewPathClassification()

  object None : ScrollViewPathClassification()

  /** More than one candidate scroll view, so there is no single obvious one to warn about. */
  object Ambiguous : ScrollViewPathClassification()

  /** The only scroll view is too short to be the screen's main scrollable content. */
  object Embedded : ScrollViewPathClassification()

  data class OffPath(
    val firstChildPath: List<String>,
    val scrollViewPath: List<String>
  ) : ScrollViewPathClassification()
}

/**
 * Mirrors how react-native-screens looks for a screen's content scroll view: it walks down the
 * first-child chain and stops at the first vertical scroll view. This inspector reports why that
 * walk fails, so the developer can be told about it.
 */
object ScrollViewPathInspector {
  const val FILL_RATIO = 0.7f
  const val MAX_DEPTH = 32

  private const val SCREENS_PACKAGE = "com.swmansion.rnscreens."
  private val SCREEN_CLASS_NAMES = setOf("Screen", "TabsScreen", "StackScreen")
  private val NAVIGATOR_HOST_CLASS_NAMES = setOf("ScreenStack", "ScreenContainer", "TabsHost", "StackHost")

  /**
   * Matches react-native-screens classes by name, because expo-router does not depend on it.
   */
  fun kindOf(view: View): ScrollViewPathViewKind {
    val className = view.javaClass.name
    if (!className.startsWith(SCREENS_PACKAGE)) {
      return ScrollViewPathViewKind.OTHER
    }
    return when (className.substringAfterLast('.')) {
      in SCREEN_CLASS_NAMES -> ScrollViewPathViewKind.SCREEN
      in NAVIGATOR_HOST_CLASS_NAMES -> ScrollViewPathViewKind.NAVIGATOR_HOST
      else -> ScrollViewPathViewKind.OTHER
    }
  }

  /**
   * Returns `null` when the container cannot be judged: it is not itself on the screen's
   * first-child path, or it has not been laid out yet.
   */
  fun classify(
    container: ViewGroup,
    kindOf: (View) -> ScrollViewPathViewKind = ::kindOf
  ): ScrollViewPathClassification? {
    if (!isOnScreenFirstChildPath(container, kindOf)) {
      return null
    }
    if (container.height <= 0) {
      return null
    }

    val firstChildPath = mutableListOf<String>()
    var current: View? = firstChildOrNull(container)
    while (current != null && firstChildPath.size < MAX_DEPTH) {
      firstChildPath.add(current.javaClass.simpleName)
      if (isVerticalScrollView(current)) {
        return ScrollViewPathClassification.FirstChild
      }
      if (kindOf(current) == ScrollViewPathViewKind.NAVIGATOR_HOST) {
        return ScrollViewPathClassification.NestedNavigator
      }
      current = firstChildOrNull(current)
    }

    val candidates = findScrollViews(container, kindOf)
    if (candidates.isEmpty()) {
      return ScrollViewPathClassification.None
    }
    if (candidates.size > 1) {
      return ScrollViewPathClassification.Ambiguous
    }

    val (scrollView, scrollViewPath) = candidates.single()
    if (scrollView.height < FILL_RATIO * container.height) {
      return ScrollViewPathClassification.Embedded
    }
    return ScrollViewPathClassification.OffPath(firstChildPath, scrollViewPath)
  }

  private fun isOnScreenFirstChildPath(
    container: ViewGroup,
    kindOf: (View) -> ScrollViewPathViewKind
  ): Boolean {
    var current: View = container
    repeat(MAX_DEPTH) {
      val parent = current.parent as? ViewGroup ?: return false
      if (parent.getChildAt(0) !== current) {
        return false
      }
      if (kindOf(parent) == ScrollViewPathViewKind.SCREEN) {
        return true
      }
      current = parent
    }
    return false
  }

  /** Breadth-first search of the container subtree, skipping nested navigators. */
  private fun findScrollViews(
    container: ViewGroup,
    kindOf: (View) -> ScrollViewPathViewKind
  ): List<Pair<View, List<String>>> {
    val found = mutableListOf<Pair<View, List<String>>>()
    val queue = ArrayDeque<Pair<View, List<String>>>()
    for (index in 0 until container.childCount) {
      val child = container.getChildAt(index)
      queue.add(child to listOf(child.javaClass.simpleName))
    }

    while (queue.isNotEmpty()) {
      val (view, path) = queue.removeFirst()
      if (isVerticalScrollView(view)) {
        found.add(view to path)
        continue
      }
      if (kindOf(view) == ScrollViewPathViewKind.NAVIGATOR_HOST) {
        continue
      }
      if (view is ViewGroup && path.size < MAX_DEPTH) {
        for (index in 0 until view.childCount) {
          val child = view.getChildAt(index)
          queue.add(child to path + child.javaClass.simpleName)
        }
      }
    }

    return found
  }

  private fun firstChildOrNull(view: View): View? =
    (view as? ViewGroup)?.takeIf { it.childCount > 0 }?.getChildAt(0)

  private fun isVerticalScrollView(view: View) = view is ScrollView || view is NestedScrollView
}
