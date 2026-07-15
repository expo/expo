@file:OptIn(
  ExperimentalMaterial3ExpressiveApi::class,
  ExperimentalMaterial3Api::class,
  ExperimentalFoundationApi::class
)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.toShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.draw.innerShadow
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.onVisibilityChanged
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.recordFromMap
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposableScope
import expo.modules.ui.convertibles.AlignmentType
import expo.modules.ui.convertibles.CompositingStrategyType
import expo.modules.ui.convertibles.GraphicsLayerParams
import expo.modules.ui.convertibles.resolveAnimatable

typealias ModifierType = Map<String, Dynamic>
typealias ModifierList = List<ModifierType>
typealias ModifierEventDispatcher = (String, Map<String, Any?>) -> Unit
typealias ModifierFactory = @Composable (ModifierType, ComposableScope?, AppContext?, ModifierEventDispatcher) -> Modifier

// region Modifier Params

@OptimizedRecord
data class PaddingAllParams(
  @Field val all: Int = 0
) : Record

@OptimizedRecord
data class PaddingParams(
  @Field val start: Int = 0,
  @Field val top: Int = 0,
  @Field val end: Int = 0,
  @Field val bottom: Int = 0
) : Record

@OptimizedRecord
data class SizeParams(
  @Field val width: Int = 0,
  @Field val height: Int = 0
) : Record

@OptimizedRecord
data class FillMaxSizeParams(
  @Field val fraction: Float = 1.0f
) : Record

@OptimizedRecord
data class FillMaxWidthParams(
  @Field val fraction: Float = 1.0f
) : Record

@OptimizedRecord
data class FillMaxHeightParams(
  @Field val fraction: Float = 1.0f
) : Record

@OptimizedRecord
data class WidthParams(
  @Field val width: Int = 0
) : Record

@OptimizedRecord
data class HeightParams(
  @Field val height: Int = 0
) : Record

@OptimizedRecord
data class WrapContentWidthParams(
  @Field val alignment: AlignmentType? = null
) : Record

@OptimizedRecord
data class WrapContentHeightParams(
  @Field val alignment: AlignmentType? = null
) : Record

@OptimizedRecord
data class DefaultMinSizeParams(
  @Field val minWidth: Float? = null,
  @Field val minHeight: Float? = null
) : Record

@OptimizedRecord
internal data class OffsetParams(
  @Field val x: Int = 0,
  @Field val y: Int = 0
) : Record

@OptimizedRecord
data class BackgroundParams(
  @Field val color: Color? = null
) : Record

// Color animation specs reuse the JS `$type` shape from `@expo/ui/jetpack-compose/modifiers/animation` (spring / tween / snap).
// Keyframes are float-only and aren't supported for colors.
private fun parseColorAnimationSpec(raw: Any?): AnimationSpec<androidx.compose.ui.graphics.Color>? {
  if (raw !is Map<*, *>) return null
  return when (raw["\$type"]) {
    "spring" -> spring(
      dampingRatio = (raw["dampingRatio"] as? Number)?.toFloat() ?: Spring.DampingRatioNoBouncy,
      stiffness = (raw["stiffness"] as? Number)?.toFloat() ?: Spring.StiffnessMedium
    )

    "tween" -> tween(
      durationMillis = (raw["durationMillis"] as? Number)?.toInt() ?: 300,
      delayMillis = (raw["delayMillis"] as? Number)?.toInt() ?: 0
    )

    "snap" -> snap(delayMillis = (raw["delayMillis"] as? Number)?.toInt() ?: 0)
    else -> null
  }
}

@OptimizedRecord
internal data class BorderParams(
  @Field val borderWidth: Int = 1,
  @Field val borderColor: Color? = null
) : Record

@OptimizedRecord
internal data class ShadowParams(
  @Field val elevation: Int = 0
) : Record

@OptimizedRecord
internal data class ShadowGeometryParams(
  @Field val shape: BuiltinShapeRecord? = null,
  @Field val radius: Float = 0f,
  @Field val spread: Float = 0f,
  @Field val color: Color? = null,
  @Field val offsetX: Float = 0f,
  @Field val offsetY: Float = 0f,
  @Field val alpha: Float = 1f
) : Record

@OptimizedRecord
internal data class AlphaParams(
  @Field val alpha: Float = 1.0f
) : Record

@OptimizedRecord
internal data class BlurParams(
  @Field val radius: Int = 0
) : Record

@OptimizedRecord
internal data class RotateParams(
  @Field val degrees: Float = 0f
) : Record

@OptimizedRecord
internal data class ZIndexParams(
  @Field val index: Float = 0f
) : Record

@OptimizedRecord
internal data class AnimateContentSizeParams(
  @Field val dampingRatio: Float = Spring.DampingRatioNoBouncy,
  @Field val stiffness: Float = Spring.StiffnessMedium
) : Record

@OptimizedRecord
internal data class WeightParams(
  @Field val weight: Float = 1f
) : Record

@OptimizedRecord
internal data class AlignParams(
  @Field val alignment: AlignmentType? = null
) : Record

@OptimizedRecord
data class TestIDParams(
  @Field val testID: String? = null
) : Record

internal enum class BuiltinShapeType(val value: String) : Enumerable {
  RECTANGLE("rectangle"),
  CIRCLE("circle"),
  ROUNDED_CORNER("roundedCorner"),
  CUT_CORNER("cutCorner"),
  MATERIAL("material")
}

@OptimizedRecord
internal data class BuiltinShapeRecord(
  @Field val type: BuiltinShapeType = BuiltinShapeType.RECTANGLE,
  @Field val radius: Float? = null,
  @Field val topStart: Float? = null,
  @Field val topEnd: Float? = null,
  @Field val bottomStart: Float? = null,
  @Field val bottomEnd: Float? = null,
  @Field val name: MaterialShapeType? = null
) : Record

@OptimizedRecord
internal data class ClipParams(
  @Field val shape: BuiltinShapeRecord? = null
) : Record

@OptimizedRecord
internal data class SelectableParams(
  @Field val selected: Boolean = false,
  @Field val role: String? = null
) : Record

@OptimizedRecord
internal data class OnVisibilityChangedParams(
  @Field val minDurationMs: Long = 0,
  @Field val minFractionVisible: Float = 1f
) : Record

@OptimizedRecord
internal data class ClickableParams(
  @Field val indication: Boolean = true
) : Record

internal enum class SemanticRoleType(val value: String) : Enumerable {
  CHECKBOX("checkbox"),
  RADIO_BUTTON("radioButton"),
  SWITCH("switch"),
  TAB("tab")
}

@OptimizedRecord
internal data class ToggleableParams(
  @Field val value: Boolean = false,
  @Field val role: SemanticRoleType? = null
) : Record

internal enum class MenuAnchorType(val value: String) : Enumerable {
  PRIMARY_NOT_EDITABLE("primaryNotEditable")
}

internal data class MenuAnchorParams(
  @Field val type: MenuAnchorType = MenuAnchorType.PRIMARY_NOT_EDITABLE,
  @Field val enabled: Boolean = true
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
 * modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
 * ```
 * ```
 */
object ModifierRegistry {

  private val modifierFactories: MutableMap<String, ModifierFactory> = mutableMapOf()

  @Composable
  private fun resolveShape(shape: BuiltinShapeRecord): Shape? {
    return when (shape.type) {
      BuiltinShapeType.RECTANGLE -> RectangleShape
      BuiltinShapeType.CIRCLE -> CircleShape
      BuiltinShapeType.ROUNDED_CORNER -> {
        val hasPerCorner =
          shape.topStart != null || shape.topEnd != null || shape.bottomStart != null || shape.bottomEnd != null
        if (hasPerCorner) {
          RoundedCornerShape(
            topStart = (shape.topStart ?: 0f).dp,
            topEnd = (shape.topEnd ?: 0f).dp,
            bottomStart = (shape.bottomStart ?: 0f).dp,
            bottomEnd = (shape.bottomEnd ?: 0f).dp
          )
        } else {
          RoundedCornerShape((shape.radius ?: 0f).dp)
        }
      }

      BuiltinShapeType.CUT_CORNER -> {
        val hasPerCorner =
          shape.topStart != null || shape.topEnd != null || shape.bottomStart != null || shape.bottomEnd != null
        if (hasPerCorner) {
          CutCornerShape(
            topStart = (shape.topStart ?: 0f).dp,
            topEnd = (shape.topEnd ?: 0f).dp,
            bottomStart = (shape.bottomStart ?: 0f).dp,
            bottomEnd = (shape.bottomEnd ?: 0f).dp
          )
        } else {
          CutCornerShape((shape.radius ?: 0f).dp)
        }
      }

      BuiltinShapeType.MATERIAL -> {
        shape.name?.toRoundedPolygon()?.toShape()
      }
    }
  }

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
   * Unregisters a previously registered modifier. Pair with `register` from
   * `OnCreate` / `OnDestroy` to avoid leaking factories between module reloads.
   */
  fun unregister(type: String) {
    modifierFactories.remove(type)
  }

  /**
   * Applies an array of modifier configs to build a Compose Modifier chain.
   */
  @Composable
  fun applyModifiers(
    modifiers: List<ModifierType>?,
    appContext: AppContext,
    scope: ComposableScope,
    eventDispatcher: ModifierEventDispatcher
  ): Modifier {
    if (modifiers.isNullOrEmpty()) return Modifier
    return modifiers.fold(Modifier as Modifier) { acc, config ->
      val type = config["\$type"]?.asString() ?: return@fold acc
      val modifier = modifierFactories[type]?.invoke(config, scope, appContext, eventDispatcher)
        ?: Modifier
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
    register("paddingAll") { map, _, appContext, _ ->
      val params = recordFromMap<PaddingAllParams>(map, appContext)
      Modifier.padding(params.all.dp)
    }

    register("padding") { map, _, appContext, _ ->
      val params = recordFromMap<PaddingParams>(map, appContext)
      Modifier.padding(
        params.start.dp,
        params.top.dp,
        params.end.dp,
        params.bottom.dp
      )
    }

    // Size modifiers
    register("size") { map, _, appContext, _ ->
      val params = recordFromMap<SizeParams>(map, appContext)
      Modifier.size(params.width.dp, params.height.dp)
    }

    register("fillMaxSize") { map, _, appContext, _ ->
      val params = recordFromMap<FillMaxSizeParams>(map, appContext)
      Modifier.fillMaxSize(fraction = params.fraction)
    }

    register("fillMaxWidth") { map, _, appContext, _ ->
      val params = recordFromMap<FillMaxWidthParams>(map, appContext)
      Modifier.fillMaxWidth(fraction = params.fraction)
    }

    register("fillMaxHeight") { map, _, appContext, _ ->
      val params = recordFromMap<FillMaxHeightParams>(map, appContext)
      Modifier.fillMaxHeight(fraction = params.fraction)
    }

    register("width") { map, _, appContext, _ ->
      val params = recordFromMap<WidthParams>(map, appContext)
      Modifier.width(params.width.dp)
    }

    register("height") { map, _, appContext, _ ->
      val params = recordFromMap<HeightParams>(map, appContext)
      Modifier.height(params.height.dp)
    }

    register("defaultMinSize") { map, _, appContext, _ ->
      val params = recordFromMap<DefaultMinSizeParams>(map, appContext)
      Modifier.defaultMinSize(
        minWidth = params.minWidth?.dp ?: androidx.compose.ui.unit.Dp.Unspecified,
        minHeight = params.minHeight?.dp ?: androidx.compose.ui.unit.Dp.Unspecified
      )
    }

    register("wrapContentWidth") { map, _, appContext, _ ->
      val params = recordFromMap<WrapContentWidthParams>(map, appContext)
      params.alignment?.toHorizontalAlignment()?.let { alignment ->
        Modifier.wrapContentWidth(align = alignment)
      } ?: Modifier.wrapContentWidth()
    }

    register("wrapContentHeight") { map, _, appContext, _ ->
      val params = recordFromMap<WrapContentHeightParams>(map, appContext)
      params.alignment?.toVerticalAlignment()?.let { alignment ->
        Modifier.wrapContentHeight(align = alignment)
      } ?: Modifier.wrapContentHeight()
    }

    // Inset modifiers
    register("imePadding") { _, _, _, _ ->
      Modifier.imePadding()
    }

    // Position modifiers
    register("offset") { map, _, appContext, _ ->
      val params = recordFromMap<OffsetParams>(map, appContext)
      Modifier.offset(params.x.dp, params.y.dp)
    }

    // Appearance modifiers
    register("background") { map, _, appContext, _ ->
      val params = recordFromMap<BackgroundParams>(map, appContext)
      val color = params.color?.compose ?: return@register Modifier
      val spec = parseColorAnimationSpec(map["animationSpec"])
      if (spec != null) {
        val animated by animateColorAsState(color, spec, label = "background-color")
        Modifier.background(animated)
      } else {
        Modifier.background(color)
      }
    }

    register("border") { map, _, appContext, _ ->
      val params = recordFromMap<BorderParams>(map, appContext)
      params.borderColor?.let { borderColor ->
        Modifier.border(BorderStroke(params.borderWidth.dp, borderColor.compose))
      } ?: Modifier
    }

    register("shadow") { map, _, appContext, _ ->
      val params = recordFromMap<ShadowParams>(map, appContext)
      Modifier.shadow(params.elevation.dp)
    }

    register("dropShadow") { map, _, appContext, _ ->
      val params = recordFromMap<ShadowGeometryParams>(map, appContext)
      val shape = params.shape?.let { resolveShape(it) } ?: RectangleShape
      Modifier.dropShadow(
        shape,
        Shadow(
          radius = params.radius.dp,
          spread = params.spread.dp,
          color = params.color.composeOrNull ?: androidx.compose.ui.graphics.Color.Black,
          offset = DpOffset(params.offsetX.dp, params.offsetY.dp),
          alpha = params.alpha
        )
      )
    }

    register("innerShadow") { map, _, appContext, _ ->
      val params = recordFromMap<ShadowGeometryParams>(map, appContext)
      val shape = params.shape?.let { resolveShape(it) } ?: RectangleShape
      Modifier.innerShadow(
        shape,
        Shadow(
          radius = params.radius.dp,
          spread = params.spread.dp,
          color = params.color.composeOrNull ?: androidx.compose.ui.graphics.Color.Black,
          offset = DpOffset(params.offsetX.dp, params.offsetY.dp),
          alpha = params.alpha
        )
      )
    }

    register("alpha") { map, _, appContext, _ ->
      val params = recordFromMap<AlphaParams>(map, appContext)
      Modifier.alpha(params.alpha)
    }

    register("blur") { map, _, appContext, _ ->
      val params = recordFromMap<BlurParams>(map, appContext)
      Modifier.blur(params.radius.dp)
    }

    // Transform modifiers
    register("rotate") { map, _, appContext, _ ->
      val params = recordFromMap<RotateParams>(map, appContext)
      Modifier.rotate(params.degrees)
    }

    register("graphicsLayer") { map, _, appContext, _ ->
      val rotationX = resolveAnimatable(map, "rotationX", 0f)
      val rotationY = resolveAnimatable(map, "rotationY", 0f)
      val rotationZ = resolveAnimatable(map, "rotationZ", 0f)
      val scaleX = resolveAnimatable(map, "scaleX", 1f)
      val scaleY = resolveAnimatable(map, "scaleY", 1f)
      val alphaVal = resolveAnimatable(map, "alpha", 1f)
      val translationX = resolveAnimatable(map, "translationX", 0f)
      val translationY = resolveAnimatable(map, "translationY", 0f)
      val shadowElevation = resolveAnimatable(map, "shadowElevation", 0f)

      // Non-animatable params parsed via Record
      val params = recordFromMap<GraphicsLayerParams>(map, appContext)
      val composeShape = params.shape?.let { resolveShape(it) } ?: RectangleShape
      val compositingStrategy = when (params.compositingStrategy) {
        CompositingStrategyType.OFFSCREEN -> CompositingStrategy.Offscreen
        CompositingStrategyType.MODULATE -> CompositingStrategy.ModulateAlpha
        else -> CompositingStrategy.Auto
      }

      val density = LocalDensity.current.density

      Modifier.graphicsLayer {
        this.rotationX = rotationX
        this.rotationY = rotationY
        this.rotationZ = rotationZ
        this.scaleX = scaleX
        this.scaleY = scaleY
        this.alpha = alphaVal
        this.translationX = translationX * density
        this.translationY = translationY * density
        this.cameraDistance = params.cameraDistance * density
        this.shadowElevation = shadowElevation * density
        this.transformOrigin = TransformOrigin(params.transformOriginX, params.transformOriginY)
        this.clip = params.clip
        this.shape = composeShape
        this.compositingStrategy = compositingStrategy
        params.ambientShadowColor?.let { this.ambientShadowColor = it.compose }
        params.spotShadowColor?.let { this.spotShadowColor = it.compose }
      }
    }

    register("zIndex") { map, _, appContext, _ ->
      val params = recordFromMap<ZIndexParams>(map, appContext)
      Modifier.zIndex(params.index)
    }

    // Animation modifiers
    register("animateContentSize") { map, _, appContext, _ ->
      val params = recordFromMap<AnimateContentSizeParams>(map, appContext)
      Modifier.animateContentSize(
        spring(dampingRatio = params.dampingRatio, stiffness = params.stiffness)
      )
    }

    // Scope-dependent modifiers
    register("weight") { map, scope, appContext, _ ->
      val params = recordFromMap<WeightParams>(map, appContext)
      scope?.rowScope?.run {
        Modifier.weight(params.weight)
      } ?: scope?.columnScope?.run {
        Modifier.weight(params.weight)
      } ?: Modifier
    }

    register("align") { map, scope, appContext, _ ->
      val params = recordFromMap<AlignParams>(map, appContext)
      scope?.boxScope?.run {
        params.alignment?.toAlignment()?.let { alignment -> Modifier.align(alignment) }
      } ?: scope?.rowScope?.run {
        params.alignment?.toVerticalAlignment()?.let { alignment -> Modifier.align(alignment) }
      } ?: scope?.columnScope?.run {
        params.alignment?.toHorizontalAlignment()?.let { alignment -> Modifier.align(alignment) }
      } ?: Modifier
    }

    register("matchParentSize") { _, scope, _, _ ->
      scope?.boxScope?.run {
        Modifier.matchParentSize()
      } ?: Modifier
    }

    // Utility modifiers
    register("testID") { map, _, appContext, _ ->
      val params = recordFromMap<TestIDParams>(map, appContext)
      params.testID?.let { testID ->
        Modifier.applyTestTag(testID)
      } ?: Modifier
    }

    register("semantics") { map, _, appContext, _ ->
      val params = recordFromMap<SemanticsParams>(map, appContext)
      params.contentType.toContentType()?.let { ct ->
        Modifier.semantics { contentType = ct }
      } ?: Modifier
    }

    register("clip") { map, _, appContext, _ ->
      val params = recordFromMap<ClipParams>(map, appContext)
      params.shape?.let { shape ->
        resolveShape(shape)?.let { Modifier.clip(it) }
      } ?: Modifier
    }

    register("onVisibilityChanged") { map, _, appContext, eventDispatcher ->
      val params = recordFromMap<OnVisibilityChangedParams>(map, appContext)
      Modifier.onVisibilityChanged(
        minDurationMs = params.minDurationMs,
        minFractionVisible = params.minFractionVisible
      ) { isVisible ->
        eventDispatcher("onVisibilityChanged", mapOf("isVisible" to isVisible))
      }
    }

    register("onSizeChanged") { _, _, _, eventDispatcher ->
      val density = LocalDensity.current
      Modifier.onSizeChanged { size ->
        with(density) {
          eventDispatcher(
            "onSizeChanged",
            mapOf(
              "width" to size.width.toDp().value,
              "height" to size.height.toDp().value
            )
          )
        }
      }
    }

    register("onGloballyPositioned") { _, _, _, eventDispatcher ->
      val density = LocalDensity.current
      Modifier.onGloballyPositioned { coordinates ->
        val position = coordinates.positionInWindow()
        with(density) {
          eventDispatcher(
            "onGloballyPositioned",
            mapOf(
              "x" to position.x.toDp().value,
              "y" to position.y.toDp().value,
              "width" to coordinates.size.width.toDp().value,
              "height" to coordinates.size.height.toDp().value
            )
          )
        }
      }
    }

    register("clickable") { map, _, appContext, eventDispatcher ->
      val params = recordFromMap<ClickableParams>(map, appContext)
      if (params.indication) {
        Modifier.clickable {
          eventDispatcher("clickable", emptyMap())
        }
      } else {
        Modifier.clickable(
          interactionSource = null,
          indication = null
        ) {
          eventDispatcher("clickable", emptyMap())
        }
      }
    }

    register("combinedClickable") { map, _, appContext, eventDispatcher ->
      val params = recordFromMap<ClickableParams>(map, appContext)
      val onClick = { eventDispatcher("combinedClickable", mapOf("event" to "click")) }
      val onLongClick = { eventDispatcher("combinedClickable", mapOf("event" to "longClick")) }
      if (params.indication) {
        Modifier.combinedClickable(onClick = onClick, onLongClick = onLongClick)
      } else {
        Modifier.combinedClickable(
          interactionSource = null,
          indication = null,
          onClick = onClick,
          onLongClick = onLongClick
        )
      }
    }

    register("selectable") { map, _, appContext, eventDispatcher ->
      val params = recordFromMap<SelectableParams>(map, appContext)
      Modifier.selectable(
        selected = params.selected,
        role = when (params.role) {
          "radioButton" -> androidx.compose.ui.semantics.Role.RadioButton
          "checkbox" -> androidx.compose.ui.semantics.Role.Checkbox
          "switch" -> androidx.compose.ui.semantics.Role.Switch
          "tab" -> androidx.compose.ui.semantics.Role.Tab
          else -> null
        },
        onClick = { eventDispatcher("selectable", emptyMap()) }
      )
    }

    register("selectableGroup") { _, _, _, _ ->
      Modifier.selectableGroup()
    }

    register("toggleable") { map, _, appContext, eventDispatcher ->
      val params = recordFromMap<ToggleableParams>(map, appContext)
      val role = when (params.role) {
        SemanticRoleType.CHECKBOX -> Role.Checkbox
        SemanticRoleType.RADIO_BUTTON -> Role.RadioButton
        SemanticRoleType.SWITCH -> Role.Switch
        SemanticRoleType.TAB -> Role.Tab
        null -> null
      }
      Modifier.toggleable(
        value = params.value,
        role = role,
        onValueChange = { eventDispatcher("toggleable", emptyMap()) }
      )
    }

    // ExposedDropdownMenuBox scope-dependent modifier
    register("menuAnchor") { map, scope, appContext, _ ->
      val dropdownScope = scope?.exposedDropdownMenuBoxScope
        ?: error("menuAnchor modifier can only be used inside ExposedDropdownMenuBox")
      val params = recordFromMap<MenuAnchorParams>(map, appContext)
      with(dropdownScope) {
        Modifier.menuAnchor(
          type = when (params.type) {
            MenuAnchorType.PRIMARY_NOT_EDITABLE -> ExposedDropdownMenuAnchorType.PrimaryNotEditable
          },
          enabled = params.enabled
        )
      }
    }

    register("verticalScroll") { _, _, _, _ ->
      Modifier.verticalScroll(rememberScrollState())
    }

    register("horizontalScroll") { _, _, _, _ ->
      Modifier.horizontalScroll(rememberScrollState())
    }
  }
}
