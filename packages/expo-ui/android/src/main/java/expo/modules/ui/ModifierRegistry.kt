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
import expo.modules.kotlin.records.recordFromMap
import expo.modules.kotlin.views.ComposableScope

typealias ModifierType = Map<String, Any?>
typealias ModifierList = List<ModifierType>
typealias ModifierFactory = (ModifierType, ComposableScope?, AppContext?) -> Modifier

// region Modifier Params

internal data class PaddingAllParams(
  @Field val all: Int = 0
) : Record

internal data class PaddingParams(
  @Field val start: Int = 0,
  @Field val top: Int = 0,
  @Field val end: Int = 0,
  @Field val bottom: Int = 0
) : Record

internal data class SizeParams(
  @Field val width: Int = 0,
  @Field val height: Int = 0
) : Record

internal data class FillMaxSizeParams(
  @Field val fraction: Float = 1.0f
) : Record

internal data class FillMaxWidthParams(
  @Field val fraction: Float = 1.0f
) : Record

internal data class FillMaxHeightParams(
  @Field val fraction: Float = 1.0f
) : Record

internal data class OffsetParams(
  @Field val x: Int = 0,
  @Field val y: Int = 0
) : Record

internal data class BackgroundParams(
  @Field val color: Color? = null
) : Record

internal data class BorderParams(
  @Field val borderWidth: Int = 1,
  @Field val borderColor: Color? = null
) : Record

internal data class ShadowParams(
  @Field val elevation: Int = 0
) : Record

internal data class AlphaParams(
  @Field val alpha: Float = 1.0f
) : Record

internal data class BlurParams(
  @Field val radius: Int = 0
) : Record

internal data class RotateParams(
  @Field val degrees: Float = 0f
) : Record

internal data class ZIndexParams(
  @Field val index: Float = 0f
) : Record

internal data class AnimateContentSizeParams(
  @Field val dampingRatio: Float = Spring.DampingRatioNoBouncy,
  @Field val stiffness: Float = Spring.StiffnessMedium
) : Record

internal data class WeightParams(
  @Field val weight: Float = 1f
) : Record

internal data class TestIDParams(
  @Field val testID: String? = null
) : Record

internal data class ClipParams(
  @Field val shape: ShapeRecord? = null
) : Record

// endregion

/**
 * Registry for Compose view modifiers that can be applied from React Native.
 * Usage in JS:
 * ```typescript
 * <Button modifiers={[paddingAll(10)]} />
 * ```
 *
 * Usage in Native:
 * ```kotlin
 * modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
 * ```
 * ```
 */
object ModifierRegistry {

  private val modifierFactories: MutableMap<String, ModifierFactory> = mutableMapOf()

  init {
    registerBuiltInModifiers()
  }

  /**
   * Registers a new modifier with the given type name.
   * The modifier factory creates a Modifier from params, scope, and appContext.
   */
  fun register(
    type: String,
    factory: ModifierFactory
  ) {
    modifierFactories[type] = factory
  }

  /**
   * Applies an array of modifier configs to build a Compose Modifier chain.
   */
  fun applyModifiers(
    modifiers: List<ModifierType>?,
    appContext: AppContext,
    scope: ComposableScope
  ): Modifier {
    if (modifiers.isNullOrEmpty()) return Modifier
    return modifiers.fold(Modifier as Modifier) { acc, config ->
      val type = config["\$type"] as? String ?: return@fold acc
      val modifier = modifierFactories[type]?.invoke(config, scope, appContext) ?: Modifier
      acc.then(modifier)
    }
  }

  /**
   * Checks if a modifier type is registered.
   */
  fun hasModifier(type: String): Boolean {
    return modifierFactories[type] != null
  }

  /**
   * Returns all registered modifier types.
   */
  fun registeredTypes(): List<String> {
    return modifierFactories.keys.toList()
  }

  private fun registerBuiltInModifiers() {
    // Padding modifiers
    register("paddingAll") { map, _, _ ->
      val params = recordFromMap<PaddingAllParams>(map)
      Modifier.padding(params.all.dp)
    }

    register("padding") { map, _, _ ->
      val params = recordFromMap<PaddingParams>(map)
      Modifier.padding(
        params.start.dp,
        params.top.dp,
        params.end.dp,
        params.bottom.dp
      )
    }

    // Size modifiers
    register("size") { map, _, _ ->
      val params = recordFromMap<SizeParams>(map)
      Modifier.size(params.width.dp, params.height.dp)
    }

    register("fillMaxSize") { map, _, _ ->
      val params = recordFromMap<FillMaxSizeParams>(map)
      Modifier.fillMaxSize(fraction = params.fraction)
    }

    register("fillMaxWidth") { map, _, _ ->
      val params = recordFromMap<FillMaxWidthParams>(map)
      Modifier.fillMaxWidth(fraction = params.fraction)
    }

    register("fillMaxHeight") { map, _, _ ->
      val params = recordFromMap<FillMaxHeightParams>(map)
      Modifier.fillMaxHeight(fraction = params.fraction)
    }

    // Position modifiers
    register("offset") { map, _, _ ->
      val params = recordFromMap<OffsetParams>(map)
      Modifier.offset(params.x.dp, params.y.dp)
    }

    // Appearance modifiers
    register("background") { map, _, _ ->
      val params = recordFromMap<BackgroundParams>(map)
      params.color?.let { color ->
        Modifier.background(color.compose)
      } ?: Modifier
    }

    register("border") { map, _, _ ->
      val params = recordFromMap<BorderParams>(map)
      params.borderColor?.let { borderColor ->
        Modifier.border(BorderStroke(params.borderWidth.dp, borderColor.compose))
      } ?: Modifier
    }

    register("shadow") { map, _, _ ->
      val params = recordFromMap<ShadowParams>(map)
      Modifier.shadow(params.elevation.dp)
    }

    register("alpha") { map, _, _ ->
      val params = recordFromMap<AlphaParams>(map)
      Modifier.alpha(params.alpha)
    }

    register("blur") { map, _, _ ->
      val params = recordFromMap<BlurParams>(map)
      Modifier.blur(params.radius.dp)
    }

    // Transform modifiers
    register("rotate") { map, _, _ ->
      val params = recordFromMap<RotateParams>(map)
      Modifier.rotate(params.degrees)
    }

    register("zIndex") { map, _, _ ->
      val params = recordFromMap<ZIndexParams>(map)
      Modifier.zIndex(params.index)
    }

    // Animation modifiers
    register("animateContentSize") { map, _, _ ->
      val params = recordFromMap<AnimateContentSizeParams>(map)
      Modifier.animateContentSize(
        spring(dampingRatio = params.dampingRatio, stiffness = params.stiffness)
      )
    }

    // Scope-dependent modifiers
    register("weight") { map, scope, _ ->
      val params = recordFromMap<WeightParams>(map)
      scope?.rowScope?.run {
        Modifier.weight(params.weight)
      } ?: scope?.columnScope?.run {
        Modifier.weight(params.weight)
      } ?: Modifier
    }

    register("matchParentSize") { _, scope, _ ->
      scope?.boxScope?.run {
        Modifier.matchParentSize()
      } ?: Modifier
    }

    // Utility modifiers
    register("testID") { map, _, _ ->
      val params = recordFromMap<TestIDParams>(map)
      params.testID?.let { testID ->
        Modifier.applyTestTag(testID)
      } ?: Modifier
    }

    register("clip") { map, _, _ ->
      val params = recordFromMap<ClipParams>(map)
      params.shape?.let { shapeRecord ->
        shapeFromShapeRecord(shapeRecord)?.let { shape ->
          Modifier.clip(shape)
        }
      } ?: Modifier
    }

    // Callback modifiers
    register("clickable") { _, _, _ ->
      Modifier.clickable { }
    }
  }
}
