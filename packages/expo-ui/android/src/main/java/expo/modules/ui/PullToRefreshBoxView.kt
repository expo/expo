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
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.ui.convertibles.ContentAlignment

data class PullToRefreshIndicatorProps(
  @Field val color: Color? = null,
  @Field val containerColor: Color? = null,
  @Field val modifiers: ModifierList = emptyList()
) : Record

data class PullToRefreshBoxProps(
  val isRefreshing: Boolean = false,
  val contentAlignment: ContentAlignment? = null,
  val indicator: PullToRefreshIndicatorProps = PullToRefreshIndicatorProps(),
  val modifiers: ModifierList = emptyList()
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
        modifier = ModifierRegistry.applyModifiers(props.indicator.modifiers, appContext, composableScope, globalEventDispatcher),
        color = props.indicator.color.composeOrNull ?: MaterialTheme.colorScheme.primary,
        containerColor = props.indicator.containerColor.composeOrNull ?: MaterialTheme.colorScheme.surfaceContainerHigh
      )
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope())
  }
}
