package expo.modules.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.asComposePath
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.graphics.shapes.CornerRounding
import androidx.graphics.shapes.RoundedPolygon
import androidx.graphics.shapes.circle
import androidx.graphics.shapes.pill
import androidx.graphics.shapes.pillStar
import androidx.graphics.shapes.rectangle
import androidx.graphics.shapes.star
import androidx.graphics.shapes.toPath
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
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
  val cornerRounding: Float = 0.0f,
  val smoothing: Float = 0.0f,
  val verticesCount: Int = 6,
  val innerRadius: Float = 0.0f,
  val radius: Float = 0.0f,
  val type: ShapeType = ShapeType.CIRCLE,
  val color: GraphicsColor? = null,
  val modifiers: ModifierList = emptyList()
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

data class ShapeRecord(
  @Field
  val cornerRounding: Float = 0.0f,
  @Field
  val smoothing: Float = 0.0f,
  @Field
  val verticesCount: Int = 6,
  @Field
  val innerRadius: Float = 0.0f,
  @Field
  val radius: Float = 0.0f,
  @Field
  val type: ShapeType = ShapeType.CIRCLE
) : Record

fun pathFromShapeRecord(record: ShapeRecord, size: Size): Path {
  return runCatching {
    when (record.type) {
      ShapeType.STAR -> createStarPath(size = size, cornerRounding = record.cornerRounding, smoothing = record.smoothing, innerRadius = record.innerRadius, radius = record.radius, verticesCount = record.verticesCount)
      ShapeType.PILL_STAR -> createPillStarPath(size = size, cornerRounding = record.cornerRounding, smoothing = record.smoothing, innerRadius = record.innerRadius, verticesCount = record.verticesCount)
      ShapeType.PILL -> createPillPath(size = size, smoothing = record.smoothing)
      ShapeType.CIRCLE -> createCirclePath(size = size, radius = record.radius, verticesCount = record.verticesCount)
      ShapeType.RECTANGLE -> createRectanglePath(size = size, cornerRounding = record.cornerRounding, smoothing = record.smoothing)
      ShapeType.POLYGON -> createPolygonPath(size = size, cornerRounding = record.cornerRounding, smoothing = record.smoothing, verticesCount = record.verticesCount)
    }
  }.getOrNull() ?: Path()
}

fun shapeFromShapeRecord(shapeRecord: ShapeRecord?): Shape? {
  if (shapeRecord == null) return null
  return object : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline {
      val path = pathFromShapeRecord(shapeRecord, size)
      return Outline.Generic(path)
    }
  }
}

@Composable
fun FunctionalComposableScope.ShapeContent(props: ShapeProps) {
  Box(
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
      .drawWithCache {
        val path = pathFromShapeRecord(
          ShapeRecord(
            cornerRounding = props.cornerRounding,
            smoothing = props.smoothing,
            innerRadius = props.innerRadius,
            radius = props.radius,
            type = props.type,
            verticesCount = props.verticesCount
          ),
          size
        )

        onDrawBehind {
          drawPath(path, color = props.color.composeOrNull ?: Color.Transparent)
        }
      }
      .fillMaxSize()
  )
}
