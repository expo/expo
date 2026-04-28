package expo.modules.ui

import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
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

@OptimizedRecord
data class HorizontalPagerPageSelectedEvent(
  @Field val position: Int = 0
) : Record

@OptimizedComposeProps
data class HorizontalPagerProps(
  val currentPage: Int? = null,
  val defaultPage: Int = 0,
  val animatePageChanges: Boolean = true,
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
  val initialPage = (props.currentPage ?: props.defaultPage).coerceAtLeast(0)
  val pagerState = rememberPagerState(
    initialPage = initialPage
  ) { pageCount }

  // Suppresses onPageSelected during programmatic scrolls. Without this, the
  // settledPage collector below would fire onPageSelected with the value the
  // parent just set via currentPage — a redundant round-trip. For animated
  // scrolls it also prevents an infinite loop when animateScrollToPage is
  // cancelled mid-flight and settles at an intermediate page.
  val isProgrammaticScroll = remember { mutableStateOf(false) }

  LaunchedEffect(props.currentPage) {
    val target = props.currentPage ?: return@LaunchedEffect
    if (pagerState.currentPage != target) {
      isProgrammaticScroll.value = true
      try {
        if (props.animatePageChanges) {
          pagerState.animateScrollToPage(target)
        } else {
          pagerState.scrollToPage(target)
        }
      } finally {
        isProgrammaticScroll.value = false
      }
    }
  }

  LaunchedEffect(pagerState) {
    snapshotFlow { pagerState.settledPage }
      .drop(1)
      .collect { page ->
        if (!isProgrammaticScroll.value) {
          onPageSelected(HorizontalPagerPageSelectedEvent(page))
        }
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
