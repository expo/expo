package expo.modules.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.expandHorizontally
import androidx.compose.animation.expandIn
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.shrinkHorizontally
import androidx.compose.animation.shrinkOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.OptimizedComposeProps

// region Transition types

enum class EnterTransitionType(val value: String) : Enumerable {
  FADE_IN("fadeIn"),
  SLIDE_IN_HORIZONTALLY("slideInHorizontally"),
  SLIDE_IN_VERTICALLY("slideInVertically"),
  EXPAND_IN("expandIn"),
  EXPAND_HORIZONTALLY("expandHorizontally"),
  EXPAND_VERTICALLY("expandVertically"),
  SCALE_IN("scaleIn")
}

enum class ExitTransitionType(val value: String) : Enumerable {
  FADE_OUT("fadeOut"),
  SLIDE_OUT_HORIZONTALLY("slideOutHorizontally"),
  SLIDE_OUT_VERTICALLY("slideOutVertically"),
  SHRINK_OUT("shrinkOut"),
  SHRINK_HORIZONTALLY("shrinkHorizontally"),
  SHRINK_VERTICALLY("shrinkVertically"),
  SCALE_OUT("scaleOut")
}

@OptimizedRecord
data class EnterTransitionRecord(
  @Field val type: EnterTransitionType = EnterTransitionType.FADE_IN,
  @Field val initialAlpha: Float? = null,
  @Field val initialOffsetX: Float? = null,
  @Field val initialOffsetY: Float? = null,
  @Field val initialScale: Float? = null
) : Record

@OptimizedRecord
data class ExitTransitionRecord(
  @Field val type: ExitTransitionType = ExitTransitionType.FADE_OUT,
  @Field val targetAlpha: Float? = null,
  @Field val targetOffsetX: Float? = null,
  @Field val targetOffsetY: Float? = null,
  @Field val targetScale: Float? = null
) : Record

// endregion

// region Transition conversion

// TODO(@ubax): expose animationSpec parameter (tween, spring, duration) for all transitions
private fun EnterTransitionRecord.toComposeTransition(): EnterTransition = when (type) {
  EnterTransitionType.FADE_IN ->
    if (initialAlpha != null) fadeIn(initialAlpha = initialAlpha) else fadeIn()
  EnterTransitionType.SLIDE_IN_HORIZONTALLY ->
    if (initialOffsetX != null) slideInHorizontally { (it * initialOffsetX).toInt() } else slideInHorizontally()
  EnterTransitionType.SLIDE_IN_VERTICALLY ->
    if (initialOffsetY != null) slideInVertically { (it * initialOffsetY).toInt() } else slideInVertically()
  // TODO(@ubax): expose expandFrom (Alignment) and initialSize parameters for expand transitions
  EnterTransitionType.EXPAND_IN -> expandIn()
  EnterTransitionType.EXPAND_HORIZONTALLY -> expandHorizontally()
  EnterTransitionType.EXPAND_VERTICALLY -> expandVertically()
  EnterTransitionType.SCALE_IN ->
    if (initialScale != null) scaleIn(initialScale = initialScale) else scaleIn()
}

private fun ExitTransitionRecord.toComposeTransition(): ExitTransition = when (type) {
  ExitTransitionType.FADE_OUT ->
    if (targetAlpha != null) fadeOut(targetAlpha = targetAlpha) else fadeOut()
  ExitTransitionType.SLIDE_OUT_HORIZONTALLY ->
    if (targetOffsetX != null) slideOutHorizontally { (it * targetOffsetX).toInt() } else slideOutHorizontally()
  ExitTransitionType.SLIDE_OUT_VERTICALLY ->
    if (targetOffsetY != null) slideOutVertically { (it * targetOffsetY).toInt() } else slideOutVertically()
  // TODO(@ubax): expose shrinkTowards (Alignment) and targetSize parameters for shrink transitions
  ExitTransitionType.SHRINK_OUT -> shrinkOut()
  ExitTransitionType.SHRINK_HORIZONTALLY -> shrinkHorizontally()
  ExitTransitionType.SHRINK_VERTICALLY -> shrinkVertically()
  ExitTransitionType.SCALE_OUT ->
    if (targetScale != null) scaleOut(targetScale = targetScale) else scaleOut()
}

private fun List<EnterTransitionRecord>.toComposedEnterTransition(): EnterTransition? =
  map { it.toComposeTransition() }.reduceOrNull { acc, transition -> acc + transition }

private fun List<ExitTransitionRecord>.toComposedExitTransition(): ExitTransition? =
  map { it.toComposeTransition() }.reduceOrNull { acc, transition -> acc + transition }

// endregion

@OptimizedComposeProps
data class AnimatedVisibilityProps(
  val visible: Boolean = true,
  val enterTransition: List<EnterTransitionRecord>? = null,
  val exitTransition: List<ExitTransitionRecord>? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.AnimatedVisibilityContent(props: AnimatedVisibilityProps) {
  val enter = props.enterTransition?.takeIf { it.isNotEmpty() }?.toComposedEnterTransition()
  val exit = props.exitTransition?.takeIf { it.isNotEmpty() }?.toComposedExitTransition()

  AnimatedVisibility(
    visible = props.visible,
    enter = enter ?: (fadeIn() + expandIn()),
    exit = exit ?: (fadeOut() + shrinkOut()),
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope())
  }
}
