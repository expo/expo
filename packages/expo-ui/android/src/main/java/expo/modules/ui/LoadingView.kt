@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.ContainedLoadingIndicator
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.LoadingIndicator
import androidx.compose.material3.LoadingIndicatorDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.state.ObservableState

// region LoadingIndicator

@OptimizedComposeProps
data class LoadingIndicatorProps(
  val progress: ObservableState? = null,
  val color: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.LoadingIndicatorContent(props: LoadingIndicatorProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val indicatorColor = props.color.composeOrNull ?: LoadingIndicatorDefaults.indicatorColor

  val progressState = props.progress
  if (progressState != null) {
    LoadingIndicator(
      progress = { (progressState.value as? Number)?.toFloat() ?: 0f },
      modifier = modifier,
      color = indicatorColor
    )
  } else {
    LoadingIndicator(
      modifier = modifier,
      color = indicatorColor
    )
  }
}

// endregion

// region ContainedLoadingIndicator

@OptimizedComposeProps
data class ContainedLoadingIndicatorProps(
  val progress: ObservableState? = null,
  val color: Color? = null,
  val containerColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.ContainedLoadingIndicatorContent(props: ContainedLoadingIndicatorProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val indicatorColor = props.color.composeOrNull ?: LoadingIndicatorDefaults.containedIndicatorColor
  val containerColor = props.containerColor.composeOrNull ?: LoadingIndicatorDefaults.containedContainerColor

  val progressState = props.progress
  if (progressState != null) {
    ContainedLoadingIndicator(
      progress = { (progressState.value as? Number)?.toFloat() ?: 0f },
      modifier = modifier,
      indicatorColor = indicatorColor,
      containerColor = containerColor
    )
  } else {
    ContainedLoadingIndicator(
      modifier = modifier,
      indicatorColor = indicatorColor,
      containerColor = containerColor
    )
  }
}

// endregion
