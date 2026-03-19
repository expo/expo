@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.convertibles.ContentAlignment

data class PullToRefreshBoxProps(
  val isRefreshing: Boolean = false,
  val contentAlignment: ContentAlignment? = null,
  val indicatorColor: Color? = null,
  val indicatorContainerColor: Color? = null,
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
    contentAlignment = props.contentAlignment?.toComposeAlignment() ?: Alignment.TopStart,
    indicator = {
      PullToRefreshDefaults.LoadingIndicator(
        isRefreshing = isRefreshing,
        state = pullToRefreshState,
        modifier = ModifierRegistry.applyModifiers(props.loadingIndicatorModifiers, appContext, composableScope, globalEventDispatcher),
        color = props.indicatorColor.composeOrNull ?: MaterialTheme.colorScheme.primary,
        containerColor = props.indicatorContainerColor.composeOrNull ?: MaterialTheme.colorScheme.surfaceContainerHigh
      )
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope())
  }
}
