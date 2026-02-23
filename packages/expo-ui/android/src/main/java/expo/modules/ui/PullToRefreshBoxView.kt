@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class PullToRefreshBoxProps(
  val isRefreshing: Boolean = false,
  val modifiers: ModifierList = emptyList(),
  val loadingIndicatorModifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.PullToRefreshBoxContent(props: PullToRefreshBoxProps, onRefresh: () -> Unit) {
  val isRefreshing = props.isRefreshing
  val pullToRefreshState = rememberPullToRefreshState()

  PullToRefreshBox(
    isRefreshing = isRefreshing,
    onRefresh = { onRefresh() },
    state = pullToRefreshState,
    indicator = {
      PullToRefreshDefaults.LoadingIndicator(
        isRefreshing = isRefreshing,
        state = pullToRefreshState,
        modifier = ModifierRegistry.applyModifiers(props.loadingIndicatorModifiers, appContext, composableScope, globalEventDispatcher)
      )
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope())
  }
}
