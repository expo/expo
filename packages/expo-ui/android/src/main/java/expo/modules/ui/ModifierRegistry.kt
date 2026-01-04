package expo.modules.ui

import android.graphics.Color
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope

/**
 * Registry for Compose view modifiers that can be applied from React Native.
 * This system uses JSON config pattern (like iOS SwiftUI modifiers) instead of SharedRef.
 *
 * Usage in JS:
 * ```typescript
 * const mod = paddingAll(10); // Returns { $type: 'paddingAll', all: 10 }
 * <Button modifiers={[mod]} />
 * ```
 *
 * Usage in Native:
 * ```kotlin
 * modifier = ModifierRegistry.applyModifiers(props.modifiers, composableScope)
 * ```
 */
object ModifierRegistry {
  /**
   * Applies an array of modifier configs to build a Compose Modifier chain.
   */
  fun applyModifiers(
    modifiers: List<ModifierConfig>?,
    scope: ComposableScope? = null,
    appContext: AppContext? = null
  ): Modifier {
    if (modifiers == null) return Modifier
    return modifiers.fold(Modifier as Modifier) { acc, config ->
      acc.then(applyModifier(config, scope, appContext))
    }
  }

  private fun applyModifier(
    config: ModifierConfig,
    scope: ComposableScope?,
    appContext: AppContext?
  ): Modifier {
    return when (config.type) {
      // Padding modifiers
      "paddingAll" -> {
        val all = config.all ?: 0
        Modifier.padding(all.dp)
      }
      "padding" -> {
        Modifier.padding(
          (config.start ?: 0).dp,
          (config.top ?: 0).dp,
          (config.end ?: 0).dp,
          (config.bottom ?: 0).dp
        )
      }

      // Size modifiers
      "size" -> {
        Modifier.size(
          (config.width ?: 0).dp,
          (config.height ?: 0).dp
        )
      }
      "fillMaxSize" -> {
        Modifier.fillMaxSize(fraction = config.fraction ?: 1.0f)
      }
      "fillMaxWidth" -> {
        Modifier.fillMaxWidth(fraction = config.fraction ?: 1.0f)
      }
      "fillMaxHeight" -> {
        Modifier.fillMaxHeight(fraction = config.fraction ?: 1.0f)
      }

      // Position modifiers
      "offset" -> {
        Modifier.offset((config.x ?: 0).dp, (config.y ?: 0).dp)
      }

      // Appearance modifiers
      "background" -> {
        config.color?.let { color ->
          Modifier.background(color.compose)
        } ?: Modifier
      }
      "border" -> {
        val borderWidth = config.borderWidth ?: 1
        config.borderColor?.let { borderColor ->
          Modifier.border(BorderStroke(borderWidth.dp, borderColor.compose))
        } ?: Modifier
      }
      "shadow" -> {
        val elevation = config.elevation ?: 0
        Modifier.shadow(elevation.dp)
      }
      "alpha" -> {
        val alpha = config.alpha ?: 1.0f
        Modifier.alpha(alpha)
      }
      "blur" -> {
        val radius = config.radius ?: 0
        Modifier.blur(radius.dp)
      }

      // Transform modifiers
      "rotate" -> {
        val degrees = config.degrees ?: 0f
        Modifier.rotate(degrees)
      }
      "zIndex" -> {
        val index = config.index ?: 0f
        Modifier.zIndex(index)
      }

      // Animation modifiers
      "animateContentSize" -> {
        val dampingRatio = config.dampingRatio ?: Spring.DampingRatioNoBouncy
        val stiffness = config.stiffness ?: Spring.StiffnessMedium
        Modifier.animateContentSize(
          spring(dampingRatio = dampingRatio, stiffness = stiffness)
        )
      }

      // Scope-dependent modifiers
      "weight" -> {
        val weight = config.weight ?: 1f
        scope?.rowScope?.run {
          Modifier.weight(weight)
        } ?: scope?.columnScope?.run {
          Modifier.weight(weight)
        } ?: Modifier
      }
      "matchParentSize" -> {
        scope?.boxScope?.run {
          Modifier.matchParentSize()
        } ?: Modifier
      }

      // Utility modifiers
      "testID" -> {
        config.testID?.let { testID ->
          Modifier.applyTestTag(testID)
        } ?: Modifier
      }
      "clip" -> {
        config.shape?.let { shapeRecord ->
          shapeFromShapeRecord(shapeRecord)?.let { shape ->
            Modifier.clip(shape)
          }
        } ?: Modifier
      }

      // Callback modifiers
      "clickable" -> {
        // Note: eventListener callback is handled by the component layer
        // This returns just the clickable modifier without the callback
        // The actual callback invocation should be set up at the component level
        Modifier.clickable { }
      }

      // Unknown modifier type - return empty modifier
      else -> Modifier
    }
  }
}

/**
 * Modifier configuration record that maps to JSON from JavaScript.
 *
 * Example JSON:
 * ```json
 * { "$type": "paddingAll", "all": 10 }
 * { "$type": "weight", "weight": 1.0 }
 * { "$type": "background", "color": "#FF0000" }
 * ```
 */
data class ModifierConfig(
  @Field(key = "\$type")
  val type: String = "",

  // Padding
  @Field val all: Int? = null,
  @Field val start: Int? = null,
  @Field val top: Int? = null,
  @Field val end: Int? = null,
  @Field val bottom: Int? = null,

  // Size
  @Field val width: Int? = null,
  @Field val height: Int? = null,
  @Field val fraction: Float? = null,

  // Position
  @Field val x: Int? = null,
  @Field val y: Int? = null,

  // Appearance
  @Field val color: Color? = null,
  @Field val borderWidth: Int? = null,
  @Field val borderColor: Color? = null,
  @Field val elevation: Int? = null,
  @Field val alpha: Float? = null,
  @Field val radius: Int? = null,

  // Transform
  @Field val degrees: Float? = null,
  @Field val index: Float? = null,

  // Animation
  @Field val dampingRatio: Float? = null,
  @Field val stiffness: Float? = null,

  // Scope-dependent
  @Field val weight: Float? = null,

  // Utility
  @Field val testID: String? = null,
  @Field val shape: ShapeRecord? = null,

  // Scope metadata (optional, for documentation/debugging)
  @Field(key = "\$scope")
  val scope: String? = null
) : Record
