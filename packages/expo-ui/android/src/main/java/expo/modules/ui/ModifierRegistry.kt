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
import expo.modules.kotlin.views.ComposableScope

typealias ModifierType = Map<String, Any?>
typealias ModifierList = List<ModifierType>
typealias ModifierFactory = (ModifierType, ComposableScope?, AppContext?) -> Modifier

/**
 * Registry for Compose view modifiers that can be applied from React Native.
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
 *
 * To register custom modifiers:
 * ```kotlin
 * ModifierRegistry.register("customModifier") { params, scope, appContext ->
 *   val value = params["value"] as? Int ?: 0
 *   Modifier.customModifier(value)
 * }
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
    register("paddingAll") { params, _, _ ->
      val all = params["all"] as? Int ?: 0
      Modifier.padding(all.dp)
    }

    register("padding") { params, _, _ ->
      Modifier.padding(
        (params["start"] as? Int ?: 0).dp,
        (params["top"] as? Int ?: 0).dp,
        (params["end"] as? Int ?: 0).dp,
        (params["bottom"] as? Int ?: 0).dp
      )
    }

    // Size modifiers
    register("size") { params, _, _ ->
      Modifier.size(
        (params["width"] as? Int ?: 0).dp,
        (params["height"] as? Int ?: 0).dp
      )
    }

    register("fillMaxSize") { params, _, _ ->
      Modifier.fillMaxSize(fraction = params["fraction"] as? Float ?: 1.0f)
    }

    register("fillMaxWidth") { params, _, _ ->
      Modifier.fillMaxWidth(fraction = params["fraction"] as? Float ?: 1.0f)
    }

    register("fillMaxHeight") { params, _, _ ->
      Modifier.fillMaxHeight(fraction = params["fraction"] as? Float ?: 1.0f)
    }

    // Position modifiers
    register("offset") { params, _, _ ->
      Modifier.offset((params["x"] as? Int ?: 0).dp, (params["y"] as? Int ?: 0).dp)
    }

    // Appearance modifiers
    register("background") { params, _, _ ->
      (params["color"] as? Color)?.let { color ->
        Modifier.background(color.compose)
      } ?: Modifier
    }

    register("border") { params, _, _ ->
      val borderWidth = params["borderWidth"] as? Int ?: 1
      (params["borderColor"] as? Color)?.let { borderColor ->
        Modifier.border(BorderStroke(borderWidth.dp, borderColor.compose))
      } ?: Modifier
    }

    register("shadow") { params, _, _ ->
      val elevation = params["elevation"] as? Int ?: 0
      Modifier.shadow(elevation.dp)
    }

    register("alpha") { params, _, _ ->
      val alpha = params["alpha"] as? Float ?: 1.0f
      Modifier.alpha(alpha)
    }

    register("blur") { params, _, _ ->
      val radius = params["radius"] as? Int ?: 0
      Modifier.blur(radius.dp)
    }

    // Transform modifiers
    register("rotate") { params, _, _ ->
      val degrees = params["degrees"] as? Float ?: 0f
      Modifier.rotate(degrees)
    }

    register("zIndex") { params, _, _ ->
      val index = params["index"] as? Float ?: 0f
      Modifier.zIndex(index)
    }

    // Animation modifiers
    register("animateContentSize") { params, _, _ ->
      val dampingRatio = params["dampingRatio"] as? Float ?: Spring.DampingRatioNoBouncy
      val stiffness = params["stiffness"] as? Float ?: Spring.StiffnessMedium
      Modifier.animateContentSize(
        spring(dampingRatio = dampingRatio, stiffness = stiffness)
      )
    }

    // Scope-dependent modifiers
    register("weight") { params, scope, _ ->
      val weight = params["weight"] as? Float ?: 1f
      scope?.rowScope?.run {
        Modifier.weight(weight)
      } ?: scope?.columnScope?.run {
        Modifier.weight(weight)
      } ?: Modifier
    }

    register("matchParentSize") { _, scope, _ ->
      scope?.boxScope?.run {
        Modifier.matchParentSize()
      } ?: Modifier
    }

    // Utility modifiers
    register("testID") { params, _, _ ->
      (params["testID"] as? String)?.let { testID ->
        Modifier.applyTestTag(testID)
      } ?: Modifier
    }

    register("clip") { params, _, _ ->
      (params["shape"] as? ShapeRecord)?.let { shapeRecord ->
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
