package expo.modules.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.ParentDataModifierNode
import androidx.compose.ui.platform.InspectorInfo
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import kotlin.math.roundToInt

/**
 * Row and Column in Compose size children from incoming constraints.
 * They cannot resolve a percentage of the parent's content box, so universal
 * `width` and `height` are measured by these layouts instead.
 */
internal enum class UniversalStackAxis {
  Horizontal,
  Vertical
}

internal val LocalUniversalStackAxis = compositionLocalOf<UniversalStackAxis?> { null }

internal data class UniversalLayoutParentData(
  val dimensions: UniversalLayoutDimensions = UniversalLayoutDimensions(),
  val weight: Float = 0f,
  val horizontalAlignment: Alignment.Horizontal? = null,
  val verticalAlignment: Alignment.Vertical? = null
)

internal fun Any?.asUniversalLayoutParentData(): UniversalLayoutParentData =
  this as? UniversalLayoutParentData ?: UniversalLayoutParentData()

@OptimizedRecord
internal data class UniversalLayoutParams(
  @Field val widthPoints: Double? = null,
  @Field val widthFraction: Double? = null,
  @Field val heightPoints: Double? = null,
  @Field val heightFraction: Double? = null
) : Record

internal data class UniversalLayoutDimensions(
  val widthPoints: Float? = null,
  val widthFraction: Float? = null,
  val heightPoints: Float? = null,
  val heightFraction: Float? = null
)

internal fun UniversalLayoutParams.toDimensions(): UniversalLayoutDimensions =
  UniversalLayoutDimensions(
    widthPoints = widthPoints.validatedUniversalDimension(),
    widthFraction = widthFraction.validatedUniversalDimension(),
    heightPoints = heightPoints.validatedUniversalDimension(),
    heightFraction = heightFraction.validatedUniversalDimension()
  )

private fun Double?.validatedUniversalDimension(): Float? =
  this?.toFloat()?.takeIf { it.isFinite() && it >= 0f }

internal data class UniversalLayoutElement(
  val dimensions: UniversalLayoutDimensions
) : ModifierNodeElement<UniversalLayoutNode>() {
  override fun create() = UniversalLayoutNode(dimensions)

  override fun update(node: UniversalLayoutNode) {
    node.dimensions = dimensions
  }

  override fun InspectorInfo.inspectableProperties() {
    name = "universalLayout"
    properties["dimensions"] = dimensions
  }
}

internal class UniversalLayoutNode(
  var dimensions: UniversalLayoutDimensions
) : Modifier.Node(), ParentDataModifierNode {
  override fun Density.modifyParentData(parentData: Any?): Any =
    parentData.asUniversalLayoutParentData().copy(dimensions = dimensions)
}

internal data class UniversalWeightElement(val weight: Float) : ModifierNodeElement<UniversalWeightNode>() {
  override fun create() = UniversalWeightNode(weight)

  override fun update(node: UniversalWeightNode) {
    node.weight = weight
  }

  override fun InspectorInfo.inspectableProperties() {
    name = "universalWeight"
    properties["weight"] = weight
  }
}

internal class UniversalWeightNode(var weight: Float) : Modifier.Node(), ParentDataModifierNode {
  override fun Density.modifyParentData(parentData: Any?): Any =
    parentData.asUniversalLayoutParentData().copy(weight = weight)
}

internal data class UniversalAlignElement(
  val horizontal: Alignment.Horizontal? = null,
  val vertical: Alignment.Vertical? = null
) : ModifierNodeElement<UniversalAlignNode>() {
  override fun create() = UniversalAlignNode(horizontal, vertical)

  override fun update(node: UniversalAlignNode) {
    node.horizontal = horizontal
    node.vertical = vertical
  }

  override fun InspectorInfo.inspectableProperties() {
    name = "universalAlign"
  }
}

internal class UniversalAlignNode(
  var horizontal: Alignment.Horizontal?,
  var vertical: Alignment.Vertical?
) : Modifier.Node(), ParentDataModifierNode {
  override fun Density.modifyParentData(parentData: Any?): Any =
    parentData.asUniversalLayoutParentData().copy(
      horizontalAlignment = horizontal,
      verticalAlignment = vertical
    )
}

private fun Float.toSafePixels(density: Float): Int =
  (this * density).roundToInt().coerceIn(0, Constraints.Infinity)

private fun Float.toSafeFractionPixels(parentSize: Int): Int =
  (this * parentSize).roundToInt().coerceIn(0, Constraints.Infinity)

private fun UniversalLayoutDimensions.resolveWidth(parentWidth: Int?, density: Float): Int? =
  widthPoints?.toSafePixels(density) ?: parentWidth?.let { widthFraction?.toSafeFractionPixels(it) }

private fun UniversalLayoutDimensions.resolveHeight(parentHeight: Int?, density: Float): Int? =
  heightPoints?.toSafePixels(density) ?: parentHeight?.let { heightFraction?.toSafeFractionPixels(it) }

/**
 * An explicit size becomes a tight constraint, clamped so `min` never exceeds `max`.
 * An unspecified axis keeps [maxWidth] or [maxHeight] as a loose upper bound.
 */
private fun fixedOrBoundedConstraints(
  width: Int?,
  height: Int?,
  maxWidth: Int,
  maxHeight: Int
): Constraints {
  val resolvedWidth = width?.coerceIn(0, maxWidth.coerceAtLeast(0))
  val resolvedHeight = height?.coerceIn(0, maxHeight.coerceAtLeast(0))
  return Constraints(
    minWidth = resolvedWidth ?: 0,
    maxWidth = resolvedWidth ?: maxWidth,
    minHeight = resolvedHeight ?: 0,
    maxHeight = resolvedHeight ?: maxHeight
  )
}

/**
 * Measures a host child.
 * Axes without a universal size keep the incoming constraints, so a tight host
 * still stretches unsized children.
 */
internal fun MeasureScope.measureUniversalChild(
  measurable: Measurable,
  constraints: Constraints,
  parentWidth: Int?,
  parentHeight: Int?
): Placeable {
  val dimensions = measurable.parentData.asUniversalLayoutParentData().dimensions
  val width = dimensions.resolveWidth(parentWidth, density)
  val height = dimensions.resolveHeight(parentHeight, density)
  if (width == null && height == null) {
    return measurable.measure(constraints)
  }

  val resolved = fixedOrBoundedConstraints(width, height, constraints.maxWidth, constraints.maxHeight)
  return measurable.measure(
    Constraints(
      minWidth = if (width != null) {
        resolved.minWidth
      } else {
        constraints.minWidth
      },
      maxWidth = if (width != null) {
        resolved.maxWidth
      } else {
        constraints.maxWidth
      },
      minHeight = if (height != null) {
        resolved.minHeight
      } else {
        constraints.minHeight
      },
      maxHeight = if (height != null) {
        resolved.maxHeight
      } else {
        constraints.maxHeight
      }
    )
  )
}

@Composable
internal fun UniversalRow(
  modifier: Modifier,
  horizontalArrangement: Arrangement.Horizontal,
  verticalAlignment: Alignment.Vertical,
  content: @Composable () -> Unit
) {
  CompositionLocalProvider(LocalUniversalStackAxis provides UniversalStackAxis.Horizontal) {
    Layout(modifier = modifier, content = content) { measurables, constraints ->
      measureUniversalStack(
        measurables,
        constraints,
        UniversalStackAxis.Horizontal,
        horizontalArrangement,
        Arrangement.Top,
        Alignment.Start,
        verticalAlignment
      )
    }
  }
}

@Composable
internal fun UniversalColumn(
  modifier: Modifier,
  verticalArrangement: Arrangement.Vertical,
  horizontalAlignment: Alignment.Horizontal,
  content: @Composable () -> Unit
) {
  CompositionLocalProvider(LocalUniversalStackAxis provides UniversalStackAxis.Vertical) {
    Layout(modifier = modifier, content = content) { measurables, constraints ->
      measureUniversalStack(
        measurables,
        constraints,
        UniversalStackAxis.Vertical,
        Arrangement.Start,
        verticalArrangement,
        horizontalAlignment,
        Alignment.Top
      )
    }
  }
}

private fun MeasureScope.measureUniversalStack(
  measurables: List<Measurable>,
  constraints: Constraints,
  axis: UniversalStackAxis,
  horizontalArrangement: Arrangement.Horizontal,
  verticalArrangement: Arrangement.Vertical,
  horizontalAlignment: Alignment.Horizontal,
  verticalAlignment: Alignment.Vertical
): MeasureResult {
  val horizontal = axis == UniversalStackAxis.Horizontal
  // A size is definite only when the parent gave this stack an exact constraint.
  // A loose max is an upper bound, not a content box to take a percentage of.
  val definiteWidth = constraints.maxWidth.takeIf {
    it != Constraints.Infinity && constraints.minWidth == it
  }
  val definiteHeight = constraints.maxHeight.takeIf {
    it != Constraints.Infinity && constraints.minHeight == it
  }
  val maxMain = if (horizontal) {
    constraints.maxWidth
  } else {
    constraints.maxHeight
  }
  val maxCross = if (horizontal) {
    constraints.maxHeight
  } else {
    constraints.maxWidth
  }
  val spacing = (
    if (horizontal) {
      horizontalArrangement.spacing.roundToPx()
    } else {
      verticalArrangement.spacing.roundToPx()
    }
    ).coerceAtLeast(0)
  val totalSpacing = spacing * (measurables.size - 1).coerceAtLeast(0)
  val placeables = arrayOfNulls<Placeable>(measurables.size)
  var occupiedMain = 0

  measurables.forEachIndexed { index, measurable ->
    val parentData = measurable.parentData.asUniversalLayoutParentData()
    if (parentData.weight > 0f) {
      return@forEachIndexed
    }

    val width = parentData.dimensions.resolveWidth(definiteWidth, density)
    val height = parentData.dimensions.resolveHeight(definiteHeight, density)
    val resolvedMain = if (horizontal) {
      width
    } else {
      height
    }
    val remainingMain = if (maxMain == Constraints.Infinity) {
      Constraints.Infinity
    } else {
      (maxMain - occupiedMain - totalSpacing).coerceAtLeast(0)
    }
    val childConstraints = if (horizontal) {
      fixedOrBoundedConstraints(width, height, resolvedMain ?: remainingMain, maxCross)
    } else {
      fixedOrBoundedConstraints(width, height, maxCross, resolvedMain ?: remainingMain)
    }
    val placeable = measurable.measure(childConstraints)
    placeables[index] = placeable
    occupiedMain += if (horizontal) {
      placeable.width
    } else {
      placeable.height
    }
  }

  var totalWeight = 0f
  measurables.forEach { measurable ->
    val weight = measurable.parentData.asUniversalLayoutParentData().weight
    if (weight > 0f) {
      totalWeight += weight
    }
  }
  if (totalWeight > 0f) {
    val targetMain = when {
      maxMain != Constraints.Infinity -> maxMain
      horizontal -> constraints.minWidth
      else -> constraints.minHeight
    }
    var remaining = (targetMain - occupiedMain - totalSpacing).coerceAtLeast(0)
    var remainingWeight = totalWeight
    measurables.forEachIndexed { index, measurable ->
      val parentData = measurable.parentData.asUniversalLayoutParentData()
      if (parentData.weight <= 0f) {
        return@forEachIndexed
      }

      val laterWeight = measurables.drop(index + 1).any {
        it.parentData.asUniversalLayoutParentData().weight > 0f
      }
      val share = if (!laterWeight) {
        remaining
      } else {
        (remaining * (parentData.weight / remainingWeight)).roundToInt()
      }
      remaining -= share
      remainingWeight -= parentData.weight
      val width = if (horizontal) {
        share
      } else {
        parentData.dimensions.resolveWidth(definiteWidth, density)
      }
      val height = if (horizontal) {
        parentData.dimensions.resolveHeight(definiteHeight, density)
      } else {
        share
      }
      placeables[index] = measurable.measure(
        fixedOrBoundedConstraints(width, height, constraints.maxWidth, constraints.maxHeight)
      )
    }
  }

  val childMainSizes = IntArray(placeables.size) { index ->
    placeables[index]?.let {
      if (horizontal) {
        it.width
      } else {
        it.height
      }
    } ?: 0
  }
  val contentMain = childMainSizes.sum() + totalSpacing
  val contentCross = placeables.maxOfOrNull {
    it?.let { placeable ->
      if (horizontal) {
        placeable.height
      } else {
        placeable.width
      }
    } ?: 0
  } ?: 0
  val width = constraints.constrainWidth(
    if (horizontal) {
      contentMain
    } else {
      contentCross
    }
  )
  val height = constraints.constrainHeight(
    if (horizontal) {
      contentCross
    } else {
      contentMain
    }
  )
  val positions = IntArray(placeables.size)
  if (horizontal) {
    with(horizontalArrangement) {
      arrange(width, childMainSizes, layoutDirection, positions)
    }
  } else {
    with(verticalArrangement) {
      arrange(height, childMainSizes, positions)
    }
  }

  return layout(width, height) {
    placeables.forEachIndexed { index, placeable ->
      placeable ?: return@forEachIndexed
      val parentData = measurables[index].parentData.asUniversalLayoutParentData()
      if (horizontal) {
        val alignment = parentData.verticalAlignment ?: verticalAlignment
        placeable.place(positions[index], alignment.align(placeable.height, height))
      } else {
        val alignment = parentData.horizontalAlignment ?: horizontalAlignment
        placeable.place(alignment.align(placeable.width, width, layoutDirection), positions[index])
      }
    }
  }
}
