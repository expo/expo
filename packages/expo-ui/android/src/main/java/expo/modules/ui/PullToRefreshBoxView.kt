@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class PullToRefreshBoxProps(
  val isRefreshing: MutableState<Boolean> = mutableStateOf(false),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList()),
  val loadingIndicatorModifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

@SuppressLint("ViewConstructor")
class PullToRefreshBoxView(context: Context, appContext: AppContext) :
  ExpoComposeView<PullToRefreshBoxProps>(context, appContext) {
  override val props = PullToRefreshBoxProps()
  private val onRefresh by EventDispatcher<Unit>()

  @Composable
  override fun ComposableScope.Content() {
    val (isRefreshing) = props.isRefreshing
    val pullToRefreshState = rememberPullToRefreshState()

    PullToRefreshBox(
      isRefreshing = isRefreshing,
      onRefresh = { onRefresh.invoke(Unit) },
      state = pullToRefreshState,
      indicator = {
        PullToRefreshDefaults.LoadingIndicator(
          isRefreshing = isRefreshing,
          state = pullToRefreshState,
          modifier = Modifier.fromExpoModifiers(props.loadingIndicatorModifiers.value, this@Content),
        )
      },
      modifier = Modifier.fromExpoModifiers(props.modifiers.value, this@Content),
    ) {
      Children(this@Content)
    }
  }
}
