package expo.modules.widgets.ui

import androidx.compose.ui.unit.dp
import androidx.glance.GlanceModifier
import androidx.glance.background
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.layout.wrapContentHeight
import androidx.glance.layout.wrapContentWidth
import androidx.glance.semantics.semantics
import androidx.glance.semantics.testTag
import expo.modules.kotlin.records.recordFromMap
import expo.modules.ui.BackgroundParams
import expo.modules.ui.DefaultMinSizeParams
import expo.modules.ui.FillMaxHeightParams
import expo.modules.ui.FillMaxSizeParams
import expo.modules.ui.FillMaxWidthParams
import expo.modules.ui.HeightParams
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierType
import expo.modules.ui.PaddingAllParams
import expo.modules.ui.PaddingParams
import expo.modules.ui.SizeParams
import expo.modules.ui.TestIDParams
import expo.modules.ui.WidthParams
import expo.modules.ui.WrapContentHeightParams
import expo.modules.ui.WrapContentWidthParams
import expo.modules.ui.colorToComposeColorOrNull

internal typealias WidgetModifierFactory = (ModifierType) -> GlanceModifier

internal fun ModifierList.toGlanceModifier(): GlanceModifier {
  return WidgetModifierRegistry.applyModifiers(this)
}

internal object WidgetModifierRegistry {
  private val modifierFactories: MutableMap<String, WidgetModifierFactory> = mutableMapOf()

  init {
    registerBuiltInModifiers()
  }

  fun register(
    type: String,
    factory: WidgetModifierFactory
  ) {
    modifierFactories[type] = factory
  }

  fun unregister(type: String) {
    modifierFactories.remove(type)
  }

  fun applyModifiers(modifiers: ModifierList?): GlanceModifier {
    if (modifiers.isNullOrEmpty()) {
      return GlanceModifier
    }

    var result: GlanceModifier = GlanceModifier
    for (config in modifiers) {
      val type = config["\$type"] as? String ?: continue
      val modifier = modifierFactories[type]?.invoke(config) ?: GlanceModifier
      result = result.then(modifier)
    }
    return result
  }

  fun hasModifier(type: String): Boolean {
    return modifierFactories[type] != null
  }

  fun registeredTypes(): List<String> {
    return modifierFactories.keys.toList()
  }

  private fun registerBuiltInModifiers() {
    register("paddingAll") { map ->
      val params = recordFromMap<PaddingAllParams>(map)
      GlanceModifier.padding(params.all.dp)
    }

    register("padding") { map ->
      val params = recordFromMap<PaddingParams>(map)
      GlanceModifier.padding(
        start = params.start.dp,
        top = params.top.dp,
        end = params.end.dp,
        bottom = params.bottom.dp
      )
    }

    register("size") { map ->
      val params = recordFromMap<SizeParams>(map)
      GlanceModifier.size(params.width.dp, params.height.dp)
    }

    register("width") { map ->
      val params = recordFromMap<WidthParams>(map)
      GlanceModifier.width(params.width.dp)
    }

    register("height") { map ->
      val params = recordFromMap<HeightParams>(map)
      GlanceModifier.height(params.height.dp)
    }

    register("defaultMinSize") { map ->
      val params = recordFromMap<DefaultMinSizeParams>(map)
      val minWidth = params.minWidth
      val minHeight = params.minHeight
      when {
        minWidth != null && minHeight != null -> GlanceModifier.size(minWidth.dp, minHeight.dp)
        minWidth != null -> GlanceModifier.width(minWidth.dp)
        minHeight != null -> GlanceModifier.height(minHeight.dp)
        else -> GlanceModifier
      }
    }

    register("wrapContentWidth") { map ->
      recordFromMap<WrapContentWidthParams>(map)
      GlanceModifier.wrapContentWidth()
    }

    register("wrapContentHeight") { map ->
      recordFromMap<WrapContentHeightParams>(map)
      GlanceModifier.wrapContentHeight()
    }

    register("fillMaxSize") { map ->
      recordFromMap<FillMaxSizeParams>(map)
      GlanceModifier.fillMaxSize()
    }

    register("fillMaxWidth") { map ->
      recordFromMap<FillMaxWidthParams>(map)
      GlanceModifier.fillMaxWidth()
    }

    register("fillMaxHeight") { map ->
      recordFromMap<FillMaxHeightParams>(map)
      GlanceModifier.fillMaxHeight()
    }

    register("background") { map ->
      val params = recordFromMap<BackgroundParams>(map)
      val color = colorToComposeColorOrNull(params.color) ?: return@register GlanceModifier
      GlanceModifier.background(color)
    }

    register("testID") { map ->
      val params = recordFromMap<TestIDParams>(map)
      params.testID?.let { testID ->
        GlanceModifier.semantics {
          testTag = testID
        }
      } ?: GlanceModifier
    }
  }
}
