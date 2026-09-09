package expo.modules.router

import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ScrollView
import androidx.core.widget.NestedScrollView
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val CONTAINER_HEIGHT = 800
private const val CONTAINER_WIDTH = 400

@RunWith(RobolectricTestRunner::class)
class ScrollViewPathInspectorTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  private class MockScreenView(context: Context) : FrameLayout(context)
  private class MockNavigatorHostView(context: Context) : FrameLayout(context)

  private val mockKindOf: (View) -> ScrollViewPathViewKind = { view ->
    when (view) {
      is MockScreenView -> ScrollViewPathViewKind.SCREEN
      is MockNavigatorHostView -> ScrollViewPathViewKind.NAVIGATOR_HOST
      else -> ScrollViewPathViewKind.OTHER
    }
  }

  /** Wraps [container] as the only child of a screen and lays the whole tree out. */
  private fun layoutUnderScreen(container: ViewGroup, height: Int = CONTAINER_HEIGHT): ViewGroup {
    val screen = MockScreenView(context)
    screen.addView(container, matchParent())
    layoutTree(screen, height)
    return container
  }

  private fun layoutTree(root: View, height: Int = CONTAINER_HEIGHT) {
    root.measure(
      View.MeasureSpec.makeMeasureSpec(CONTAINER_WIDTH, View.MeasureSpec.EXACTLY),
      View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
    )
    root.layout(0, 0, CONTAINER_WIDTH, height)
  }

  private fun matchParent() =
    FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)

  private fun fixedHeight(height: Int) =
    FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, height)

  @Test
  fun `scroll view as the first child is on the path`() {
    val container = FrameLayout(context)
    container.addView(ScrollView(context), matchParent())
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.FirstChild,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `scroll view behind a wrapper is on the path`() {
    val wrapper = FrameLayout(context)
    wrapper.addView(ScrollView(context), matchParent())
    val container = FrameLayout(context)
    container.addView(wrapper, matchParent())
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.FirstChild,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `header before a screen filling scroll view is off the path`() {
    val container = FrameLayout(context)
    container.addView(View(context), fixedHeight(40))
    container.addView(ScrollView(context), matchParent())
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.OffPath(
        firstChildPath = listOf("View"),
        scrollViewPath = listOf("ScrollView")
      ),
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `scroll view smaller than the container is embedded`() {
    val container = FrameLayout(context)
    container.addView(View(context), fixedHeight(40))
    container.addView(ScrollView(context), fixedHeight(CONTAINER_HEIGHT / 2))
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.Embedded,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `two screen filling scroll views off the path are ambiguous`() {
    val container = FrameLayout(context)
    container.addView(View(context), fixedHeight(40))
    container.addView(ScrollView(context), matchParent())
    container.addView(ScrollView(context), matchParent())
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.Ambiguous,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `container without a scroll view reports none`() {
    val container = FrameLayout(context)
    container.addView(View(context), fixedHeight(40))
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.None,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `navigator host on the first child path reports a nested navigator`() {
    val host = MockNavigatorHostView(context)
    host.addView(ScrollView(context), matchParent())
    val container = FrameLayout(context)
    container.addView(host, matchParent())
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.NestedNavigator,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `horizontal scroll view is not a scroll view`() {
    val container = FrameLayout(context)
    container.addView(View(context), fixedHeight(40))
    container.addView(HorizontalScrollView(context), matchParent())
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.None,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `nested scroll view counts as a scroll view`() {
    val container = FrameLayout(context)
    container.addView(NestedScrollView(context), matchParent())
    layoutUnderScreen(container)

    assertEquals(
      ScrollViewPathClassification.FirstChild,
      ScrollViewPathInspector.classify(container, mockKindOf)
    )
  }

  @Test
  fun `container off the screen first child path is not reported`() {
    val container = FrameLayout(context)
    container.addView(ScrollView(context), matchParent())
    val screen = MockScreenView(context)
    screen.addView(View(context), fixedHeight(40))
    screen.addView(container, matchParent())
    layoutTree(screen)

    assertNull(ScrollViewPathInspector.classify(container, mockKindOf))
  }

  @Test
  fun `container without a screen ancestor is not reported`() {
    val container = FrameLayout(context)
    container.addView(ScrollView(context), matchParent())
    val root = FrameLayout(context)
    root.addView(container, matchParent())
    layoutTree(root)

    assertNull(ScrollViewPathInspector.classify(container, mockKindOf))
  }

  @Test
  fun `container without a height is not reported`() {
    val container = FrameLayout(context)
    container.addView(ScrollView(context), matchParent())
    layoutUnderScreen(container, height = 0)

    assertNull(ScrollViewPathInspector.classify(container, mockKindOf))
  }

  @Test
  fun `a plain view is of other kind`() {
    assertEquals(ScrollViewPathViewKind.OTHER, ScrollViewPathInspector.kindOf(View(context)))
  }
}
