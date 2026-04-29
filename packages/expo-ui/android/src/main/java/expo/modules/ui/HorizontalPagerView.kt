package expo.modules.ui

import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.drop
import androidx.compose.ui.unit.dp
import androidx.core.view.size
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.state.ObservableState

@OptimizedRecord
data class HorizontalPagerPageSelectedEvent(
  @Field val position: Int = 0
) : Record

@OptimizedComposeProps
data class HorizontalPagerProps(
  val currentPageState: ObservableState? = null,
  val commandState: ObservableState? = null,
  val pageSpacing: Float = 0f,
  val contentPadding: Either<Float, PaddingValuesRecord>? = null,
  val userScrollEnabled: Boolean = true,
  val reverseLayout: Boolean = false,
  val beyondViewportPageCount: Int = 0,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.HorizontalPagerContent(
  props: HorizontalPagerProps,
  onPageSelected: (HorizontalPagerPageSelectedEvent) -> Unit
) {
  val pageCount = view.size
  val currentPageState = props.currentPageState
  val initialPage = ((currentPageState?.value as? Number)?.toInt() ?: 0).coerceAtLeast(0)
  val pagerState = rememberPagerState(
    initialPage = initialPage
  ) { pageCount }

  // Observe scroll commands from JS. The JS-side seq counter makes consecutive
  // requests with the same (page, animated) tuple distinct so the Map's
  // structural equality changes and this effect re-keys.
  val command = props.commandState?.binding<Map<String, Any?>?>(null)
  LaunchedEffect(command) {
    if (command == null) return@LaunchedEffect
    val target = ((command["page"] as? Number)?.toInt() ?: return@LaunchedEffect).coerceAtLeast(0)
    val animated = command["animated"] as? Boolean ?: true
    if (pagerState.currentPage != target) {
      if (animated) {
        pagerState.animateScrollToPage(target)
      } else {
        pagerState.scrollToPage(target)
      }
    }
  }

  // Mirror settled page back to JS. Drop the first emission (pagerState's
  // initial value) so we don't echo on mount.
  LaunchedEffect(pagerState) {
    snapshotFlow { pagerState.settledPage }
      .drop(1)
      .collect { page ->
        currentPageState?.value = page
        onPageSelected(HorizontalPagerPageSelectedEvent(page))
      }
  }

  val contentPadding = props.contentPadding.toPaddingValues()

  HorizontalPager(
    state = pagerState,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    contentPadding = contentPadding,
    pageSpacing = props.pageSpacing.dp,
    userScrollEnabled = props.userScrollEnabled,
    reverseLayout = props.reverseLayout,
    beyondViewportPageCount = props.beyondViewportPageCount
  ) { pageIndex ->
    Child(UIComposableScope(), pageIndex)
  }
}
