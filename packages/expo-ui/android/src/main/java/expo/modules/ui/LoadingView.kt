@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.content.Context
import androidx.compose.material3.ContainedLoadingIndicator
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.LoadingIndicator
import androidx.compose.material3.LoadingIndicatorDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ExpoComposeView
import android.graphics.Color as AndroidColor

enum class LoadingIndicatorVariant(val value: String) : Enumerable {
  DEFAULT("default"),
  CONTAINED("contained")
}

data class LoadingProps(
  val variant: MutableState<LoadingIndicatorVariant> = mutableStateOf(LoadingIndicatorVariant.DEFAULT),
  val progress: MutableState<Float?> = mutableStateOf(null),
  val color: MutableState<AndroidColor?> = mutableStateOf(null),
  val containerColor: MutableState<AndroidColor?> = mutableStateOf(null),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class LoadingView(context: Context, appContext: AppContext) :
  ExpoComposeView<LoadingProps>(context, appContext) {
  override val props = LoadingProps()

  @Composable
  override fun ComposableScope.Content() {
    val (variant) = props.variant
    val (progress) = props.progress
    val (color) = props.color
    val (containerColor) = props.containerColor

    DynamicTheme {
      val modifier = Modifier.fromExpoModifiers(props.modifiers.value)
      when (variant) {
        LoadingIndicatorVariant.CONTAINED -> {
          val indicatorColor = color.composeOrNull ?: LoadingIndicatorDefaults.containedIndicatorColor
          val containerColor = containerColor.composeOrNull ?: LoadingIndicatorDefaults.containedContainerColor

          if (progress != null) {
            ContainedLoadingIndicator(
              progress = { progress },
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
        LoadingIndicatorVariant.DEFAULT -> {
          val indicatorColor = color.composeOrNull ?: LoadingIndicatorDefaults.indicatorColor

          if (progress != null) {
            LoadingIndicator(
              progress = { progress },
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
      }
    }
  }
}
