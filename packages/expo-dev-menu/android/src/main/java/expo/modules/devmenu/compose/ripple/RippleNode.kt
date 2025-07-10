/*
 * Copyright 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package expo.modules.devmenu.compose.ripple

import androidx.collection.mutableObjectListOf
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.TweenSpec
import androidx.compose.foundation.Indication
import androidx.compose.foundation.interaction.DragInteraction
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.HoverInteraction
import androidx.compose.foundation.interaction.Interaction
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorProducer
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.node.CompositionLocalConsumerModifierNode
import androidx.compose.ui.node.DelegatableNode
import androidx.compose.ui.node.DelegatingNode
import androidx.compose.ui.node.DrawModifierNode
import androidx.compose.ui.node.LayoutAwareModifierNode
import androidx.compose.ui.node.invalidateDraw
import androidx.compose.ui.node.requireDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.isUnspecified
import androidx.compose.ui.unit.toSize
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

/**
 * Creates a Ripple node using the values provided.
 *
 * A Ripple is a Material implementation of [Indication] that expresses different [Interaction]s
 * by drawing ripple animations and state layers.
 *
 * A Ripple responds to [PressInteraction.Press] by starting a new [RippleAnimation], and
 * responds to other [Interaction]s by showing a fixed [StateLayer] with varying alpha values
 * depending on the [Interaction].
 *
 * This Ripple node is a low level building block for building IndicationNodeFactory implementations
 * that use a Ripple - higher level design system libraries such as material and material3 provide
 * [Indication] implementations using this node internally. In most cases you should use those
 * factories directly: this node exists for design system libraries to delegate their Ripple
 * implementation to, after querying any required theme values for customizing the Ripple.
 *
 * NOTE: when using this factory with [DelegatingNode.delegate], ensure that the node is created
 * once or [DelegatingNode.undelegate] is called in [Modifier.Node.onDetach]. Repeatedly delegating
 * to a new node returned by this method in [Modifier.Node.onAttach] without removing the old one
 * will result in multiple ripple nodes being attached to the node.
 *
 * @param interactionSource the [InteractionSource] used to determine the state of the ripple.
 * @param bounded if true, ripples are clipped by the bounds of the target layout. Unbounded
 * ripples always animate from the target layout center, bounded ripples animate from the touch
 * position.
 * @param radius the radius for the ripple. If [Dp.Unspecified] is provided then the size will be
 * calculated based on the target layout size.
 * @param color the color of the ripple. This color is usually the same color used by the text or
 * iconography in the component. This color will then have [rippleAlpha] applied to calculate the
 * final color used to draw the ripple.
 * @param rippleAlpha the [RippleAlpha] that will be applied to the [color] depending on the state
 * of the ripple.
 */
public fun createRippleModifierNode(
  interactionSource: InteractionSource,
  bounded: Boolean,
  radius: Dp,
  color: ColorProducer,
  rippleAlpha: () -> RippleAlpha
): DelegatableNode {
  return createPlatformRippleNode(interactionSource, bounded, radius, color, rippleAlpha)
}

/**
 * Abstract [Modifier.Node] that provides common functionality used by ripple node implementations.
 * Implementing classes should use [stateLayer] to draw the [StateLayer], so they only need to
 * handle showing the ripple effect when pressed, and not other [Interaction]s.
 */
internal abstract class RippleNode(
  private val interactionSource: InteractionSource,
  protected val bounded: Boolean,
  private val radius: Dp,
  private val color: ColorProducer,
  protected val rippleAlpha: () -> RippleAlpha
) : Modifier.Node(),
  CompositionLocalConsumerModifierNode,
  DrawModifierNode,
  LayoutAwareModifierNode {
  final override val shouldAutoInvalidate: Boolean = false

  private var stateLayer: StateLayer? = null

  // The following are calculated inside onRemeasured(). These must be initialized before adding
  // a ripple.

  // Target radius updating over time for existing ripples isn't supported for Android, and
  // isn't implemented in common, so for now it can be private.
  protected var targetRadius: Float = 0f

  // The size is needed for Android to update ripple bounds if the size changes
  protected var rippleSize: Size = Size.Zero
    private set

  val rippleColor: Color
    get() = color()

  // Track interactions that were emitted before we have been placed - we need to wait until we
  // have a valid size in order to set the radius and size correctly.
  private var hasValidSize = false
  private val pendingInteractions = mutableObjectListOf<PressInteraction>()

  override fun onRemeasured(size: IntSize) {
    hasValidSize = true
    val density = requireDensity()
    rippleSize = size.toSize()
    targetRadius = with(density) {
      if (radius.isUnspecified) {
        // Explicitly calculate the radius instead of using RippleDrawable.RADIUS_AUTO on
        // Android since the latest spec does not match with the existing radius calculation
        // in the framework.
        getRippleEndRadius(bounded, rippleSize)
      } else {
        radius.toPx()
      }
    }
    // Flush any pending interactions that were waiting for measurement
    pendingInteractions.forEach {
      handlePressInteraction(it)
    }
    pendingInteractions.clear()
  }

  override fun onAttach() {
    coroutineScope.launch {
      interactionSource.interactions.collect { interaction ->
        when (interaction) {
          is PressInteraction -> {
            if (hasValidSize) {
              handlePressInteraction(interaction)
            } else {
              // Handle these later when we have a valid size
              pendingInteractions += interaction
            }
          }
          else -> updateStateLayer(interaction, this)
        }
      }
    }
  }

  private fun handlePressInteraction(pressInteraction: PressInteraction) {
    when (pressInteraction) {
      is PressInteraction.Press -> addRipple(pressInteraction, rippleSize, targetRadius)
      is PressInteraction.Release -> removeRipple(pressInteraction.press)
      is PressInteraction.Cancel -> removeRipple(pressInteraction.press)
    }
  }

  override fun ContentDrawScope.draw() {
    drawContent()
    stateLayer?.run {
      drawStateLayer(targetRadius, rippleColor)
    }
    drawRipples()
  }

  abstract fun DrawScope.drawRipples()

  abstract fun addRipple(interaction: PressInteraction.Press, size: Size, targetRadius: Float)
  abstract fun removeRipple(interaction: PressInteraction.Press)
  private fun updateStateLayer(interaction: Interaction, scope: CoroutineScope) {
    val stateLayer = stateLayer ?: StateLayer(bounded, rippleAlpha).also { instance ->
      // Invalidate when adding the state layer so we can start drawing it
      invalidateDraw()
      stateLayer = instance
    }
    stateLayer.handleInteraction(interaction, scope)
  }
}

/**
 * Represents the layer underneath the press ripple, that displays an overlay for states such as
 * [DragInteraction.Start].
 *
 * Typically, there should be both an 'incoming' and an 'outgoing' layer, so that when
 * transitioning between two states, the incoming of the new state, and the outgoing of the old
 * state can be displayed. However, because:
 *
 * a) the duration of these outgoing transitions are so short (mostly 15ms, which is less than 1
 * frame at 60fps), and hence are barely noticeable if they happen at the same time as an
 * incoming transition
 * b) two layers cause a lot of extra work, and related performance concerns
 *
 * We skip managing two layers, and instead only show one layer. The details for the
 * [AnimationSpec]s used are as follows:
 *
 * No state -> a state = incoming transition for the new state
 * A state -> a different state = incoming transition for the new state
 * A state -> no state = outgoing transition for the old state
 *
 * @see incomingStateLayerAnimationSpecFor
 * @see outgoingStateLayerAnimationSpecFor
 */
private class StateLayer(
  private val bounded: Boolean,
  private val rippleAlpha: () -> RippleAlpha
) {
  private val animatedAlpha = Animatable(0f)

  private val interactions: MutableList<Interaction> = mutableListOf()
  private var currentInteraction: Interaction? = null

  internal fun handleInteraction(interaction: Interaction, scope: CoroutineScope) {
    when (interaction) {
      is HoverInteraction.Enter -> {
        interactions.add(interaction)
      }
      is HoverInteraction.Exit -> {
        interactions.remove(interaction.enter)
      }
      is FocusInteraction.Focus -> {
        interactions.add(interaction)
      }
      is FocusInteraction.Unfocus -> {
        interactions.remove(interaction.focus)
      }
      is DragInteraction.Start -> {
        interactions.add(interaction)
      }
      is DragInteraction.Stop -> {
        interactions.remove(interaction.start)
      }
      is DragInteraction.Cancel -> {
        interactions.remove(interaction.start)
      }
      else -> return
    }

    // The most recent interaction is the one we want to show
    val newInteraction = interactions.lastOrNull()

    if (currentInteraction != newInteraction) {
      if (newInteraction != null) {
        val rippleAlpha = rippleAlpha()
        val targetAlpha = when (interaction) {
          is HoverInteraction.Enter -> rippleAlpha.hoveredAlpha
          is FocusInteraction.Focus -> rippleAlpha.focusedAlpha
          is DragInteraction.Start -> rippleAlpha.draggedAlpha
          else -> 0f
        }
        val incomingAnimationSpec = incomingStateLayerAnimationSpecFor(newInteraction)

        scope.launch {
          animatedAlpha.animateTo(targetAlpha, incomingAnimationSpec)
        }
      } else {
        val outgoingAnimationSpec = outgoingStateLayerAnimationSpecFor(currentInteraction)

        scope.launch {
          animatedAlpha.animateTo(0f, outgoingAnimationSpec)
        }
      }
      currentInteraction = newInteraction
    }
  }

  fun DrawScope.drawStateLayer(radius: Float, color: Color) {
    val alpha = animatedAlpha.value

    if (alpha > 0f) {
      val modulatedColor = color.copy(alpha = alpha)

      if (bounded) {
        clipRect {
          drawCircle(modulatedColor, radius)
        }
      } else {
        drawCircle(modulatedColor, radius)
      }
    }
  }
}

/**
 * @return the [AnimationSpec] used when transitioning to [interaction], either from a previous
 * state, or no state.
 */
private fun incomingStateLayerAnimationSpecFor(interaction: Interaction): AnimationSpec<Float> {
  return when (interaction) {
    is HoverInteraction.Enter -> DefaultTweenSpec
    is FocusInteraction.Focus -> TweenSpec(durationMillis = 45, easing = LinearEasing)
    is DragInteraction.Start -> TweenSpec(durationMillis = 45, easing = LinearEasing)
    else -> DefaultTweenSpec
  }
}

/**
 * @return the [AnimationSpec] used when transitioning away from [interaction], to no state.
 */
private fun outgoingStateLayerAnimationSpecFor(interaction: Interaction?): AnimationSpec<Float> {
  return when (interaction) {
    is HoverInteraction.Enter -> DefaultTweenSpec
    is FocusInteraction.Focus -> DefaultTweenSpec
    is DragInteraction.Start -> TweenSpec(durationMillis = 150, easing = LinearEasing)
    else -> DefaultTweenSpec
  }
}

/**
 * Default / fallback [AnimationSpec].
 */
private val DefaultTweenSpec = TweenSpec<Float>(durationMillis = 15, easing = LinearEasing)
