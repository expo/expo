package expo.modules.ui

import android.content.Context
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.ui.graphics.Color
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.graphics.shapes.RoundedPolygon
import androidx.graphics.shapes.toPath
import androidx.compose.ui.graphics.asComposePath
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.graphics.shapes.CornerRounding
import androidx.graphics.shapes.circle
import androidx.graphics.shapes.pill
import androidx.graphics.shapes.pillStar
import androidx.graphics.shapes.rectangle
import androidx.graphics.shapes.star
import expo.modules.kotlin.types.Enumerable
import android.graphics.Color as GraphicsColor

enum class ShapeType(val value: String) : Enumerable {
  STAR("star"),
  PILL_STAR("pillStar"),
  PILL("pill"),
  CIRCLE("circle"),
  RECTANGLE("rectangle"),
  POLYGON("polygon")
}

data class ShapeProps(
  val cornerRounding: MutableState<Float> = mutableFloatStateOf(0.0f),
  val smoothing: MutableState<Float> = mutableFloatStateOf(0.0f),
  val verticesCount: MutableState<Int> = mutableIntStateOf(6),
  val innerRadius: MutableState<Float> = mutableFloatStateOf(0.0f),
  val radius: MutableState<Float> = mutableFloatStateOf(0.0f),
  val type: MutableState<ShapeType> = mutableStateOf(ShapeType.CIRCLE),
  val color: MutableState<GraphicsColor?> = mutableStateOf(null),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

private fun Size.centerX() = this.width / 2
private fun Size.centerY() = this.height / 2

private fun createStarPath(size: Size, cornerRounding: Float, smoothing: Float, innerRadius: Float, radius: Float, verticesCount: Int): Path {
  val rounding = CornerRounding(size.minDimension * cornerRounding, smoothing = smoothing)
  return RoundedPolygon.star(
    numVerticesPerRadius = verticesCount,
    innerRadius = size.minDimension * 0.5f * innerRadius.coerceAtMost(radius - 0.001f).coerceAtLeast(0.001f),
    radius = size.minDimension * 0.5f * radius.coerceAtLeast(0.002f),
    centerX = size.centerX(),
    centerY = size.centerY(),
    rounding = rounding
  ).toPath().asComposePath()
}

private fun createPillStarPath(size: Size, cornerRounding: Float, smoothing: Float, innerRadius: Float, verticesCount: Int): Path {
  val rounding = CornerRounding(size.minDimension * cornerRounding, smoothing = smoothing)
  return RoundedPolygon.pillStar(
    numVerticesPerRadius = verticesCount,
    width = size.width / 2,
    height = size.height / 2,
    innerRadiusRatio = innerRadius.coerceAtMost(1f - 0.001f).coerceAtLeast(0.001f),
    centerX = size.centerX(),
    centerY = size.centerY(),
    rounding = rounding
  ).toPath().asComposePath()
}

private fun createPillPath(size: Size, smoothing: Float): Path {
  return RoundedPolygon.pill(
    centerX = size.centerX(),
    centerY = size.centerY(),
    width = size.width,
    height = size.height,
    smoothing = smoothing
  ).toPath().asComposePath()
}

private fun createPolygonPath(size: Size, cornerRounding: Float, smoothing: Float, verticesCount: Int): Path {
  val rounding = CornerRounding(size.minDimension * cornerRounding, smoothing = smoothing)
  return RoundedPolygon(
    numVertices = verticesCount.coerceAtLeast(3),
    radius = size.minDimension / 2,
    centerX = size.centerX(),
    centerY = size.centerY(),
    rounding = rounding
  ).toPath().asComposePath()
}

private fun createCirclePath(size: Size, radius: Float, verticesCount: Int): Path {
  return RoundedPolygon.circle(
    centerX = size.centerX(),
    centerY = size.centerY(),
    radius = size.minDimension * 0.5f * radius.coerceAtLeast(0.002f),
    numVertices = verticesCount.coerceAtLeast(3)
  ).toPath().asComposePath()
}

private fun createRectanglePath(size: Size, cornerRounding: Float, smoothing: Float): Path {
  val rounding = CornerRounding(size.minDimension * cornerRounding, smoothing = smoothing)
  return RoundedPolygon.rectangle(
    centerX = size.centerX(),
    centerY = size.centerY(),
    rounding = rounding,
    width = size.width,
    height = size.height
  ).toPath().asComposePath()
}

class ShapeView(context: Context, appContext: AppContext) : ExpoComposeView<ShapeProps>(context, appContext, withHostingView = true) {
  override val props = ShapeProps()

  @Composable
  override fun Content(modifier: Modifier) {
    val (smoothing) = props.smoothing
    val (cornerRounding) = props.cornerRounding
    val (innerRadius) = props.innerRadius
    val (radius) = props.radius
    val (shapeType) = props.type
    val (verticesCount) = props.verticesCount
    val (color) = props.color
    Box(
      modifier = Modifier.fromExpoModifiers(props.modifiers.value)
        .drawWithCache {
          val path = when (shapeType) {
            ShapeType.STAR -> createStarPath(size = size, cornerRounding = cornerRounding, smoothing = smoothing, innerRadius = innerRadius, radius = radius, verticesCount = verticesCount)
            ShapeType.PILL_STAR -> createPillStarPath(size = size, cornerRounding = cornerRounding, smoothing = smoothing, innerRadius = innerRadius, verticesCount = verticesCount)
            ShapeType.PILL -> createPillPath(size = size, smoothing = smoothing)
            ShapeType.CIRCLE -> createCirclePath(size = size, radius = radius, verticesCount = verticesCount)
            ShapeType.RECTANGLE -> createRectanglePath(size = size, cornerRounding = cornerRounding, smoothing = smoothing)
            ShapeType.POLYGON -> createPolygonPath(size = size, cornerRounding = cornerRounding, smoothing = smoothing, verticesCount = verticesCount)
          }

          onDrawBehind {
            drawPath(path, color = color.composeOrNull ?: Color.Transparent)
          }
        }
        .fillMaxSize()
    )
  }
}
