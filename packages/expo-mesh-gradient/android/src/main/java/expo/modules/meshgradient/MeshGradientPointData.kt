package expo.modules.meshgradient

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.lerp

// Based on https://gist.github.com/sinasamaki/05725557c945c5329fdba4a3494aaecb
class PointData(
  private val points: List<List<Pair<Offset, Color>>>,
  private val stepsX: Int,
  private val stepsY: Int,
  private val smoothsColors: Boolean
) {
  val offsets: MutableList<Offset>
  val colors: MutableList<Color>
  val indices: List<Int>
  private val xLength: Int = (points[0].size * stepsX) - (stepsX - 1)
  private val yLength: Int = (points.size * stepsY) - (stepsY - 1)
  private val measure = PathMeasure()

  private val indicesBlocks: List<IndicesBlock>

  init {
    offsets = buildList {
      repeat(xLength * yLength) {
        add(Offset(0f, 0f))
      }
    }.toMutableList()

    colors = buildList {
      repeat(xLength * yLength) {
        add(Color.Transparent)
      }
    }.toMutableList()

    indicesBlocks =
      buildList {
        for (y in 0..yLength - 2) {
          for (x in 0..xLength - 2) {
            val a = (y * xLength) + x
            val b = a + 1
            val c = ((y + 1) * xLength) + x
            val d = c + 1
            add(
              IndicesBlock(
                indices = buildList {
                  add(a)
                  add(c)
                  add(d)

                  add(a)
                  add(b)
                  add(d)
                },
                x = x, y = y
              )
            )
          }
        }
      }

    indices = indicesBlocks.flatMap { it.indices }
    generateInterpolatedOffsets()
  }

  private fun generateInterpolatedOffsets() {
    for (y in 0..points.lastIndex) {
      for (x in 0..points[y].lastIndex) {
        this[x * stepsX, y * stepsY] = points[y][x].first
        this[x * stepsX, y * stepsY] = points[y][x].second
        if (x != points[y].lastIndex) {
          val path = cubicPathX(
            point1 = points[y][x].first,
            point2 = points[y][x + 1].first,
            when (x) {
              0 -> 0
              points[y].lastIndex - 1 -> 2
              else -> 1
            }
          )
          measure.setPath(path, false)
          for (i in 1..<stepsX) {
            measure.getPosition(i / stepsX.toFloat() * measure.length).let {
              this[(x * stepsX) + i, (y * stepsY)] = Offset(it.x, it.y)
              this[(x * stepsX) + i, (y * stepsY)] =
                interpolateColor(
                  points[y][x].second,
                  points[y][x + 1].second,
                  i / stepsX.toFloat()
                )
            }
          }
        }
      }
    }

    for (y in 0..<points.lastIndex) {
      for (x in 0..<this.xLength) {
        val path = cubicPathY(
          point1 = this[x, y * stepsY].let { Offset(it.x, it.y) },
          point2 = this[x, (y + 1) * stepsY].let { Offset(it.x, it.y) },
          when (y) {
            0 -> 0
            points[y].lastIndex - 1 -> 2
            else -> 1
          }
        )
        measure.setPath(path, false)
        for (i in (1..<stepsY)) {
          val point3 = measure.getPosition(i / stepsY.toFloat() * measure.length).let {
            Offset(it.x, it.y)
          }
          this[x, ((y * stepsY) + i)] = point3
          this[x, ((y * stepsY) + i)] = interpolateColor(
            this.getColor(x, y * stepsY),
            this.getColor(x, (y + 1) * stepsY),
            i / stepsY.toFloat()
          )
        }
      }
    }
  }

  data class IndicesBlock(val indices: List<Int>, val x: Int, val y: Int)

  operator fun get(x: Int, y: Int): Offset {
    val index = (y * xLength) + x
    return offsets[index]
  }

  private fun getColor(x: Int, y: Int): Color {
    val index = (y * xLength) + x
    return colors[index]
  }

  private operator fun set(x: Int, y: Int, offset: Offset) {
    val index = (y * xLength) + x
    offsets[index] = Offset(offset.x, offset.y)
  }

  private operator fun set(x: Int, y: Int, color: Color) {
    val index = (y * xLength) + x
    colors[index] = color
  }

  private fun interpolateColor(
    color1: Color,
    color2: Color,
    fraction: Float
  ): Color {
    return if (smoothsColors) {
      cubic(color1, color2, fraction)
    } else {
      lerp(color1, color2, fraction)
    }
  }
}

private fun cubicPathX(point1: Offset, point2: Offset, position: Int): Path {
  val path = Path().apply {
    moveTo(point1.x, point1.y)
    val delta = (point2.x - point1.x) * .5f
    when (position) {
      0 -> cubicTo(
        point1.x,
        point1.y,
        point2.x - delta,
        point2.y,
        point2.x,
        point2.y
      )
      2 -> cubicTo(
        point1.x + delta,
        point1.y,
        point2.x,
        point2.y,
        point2.x,
        point2.y
      )
      else -> cubicTo(
        point1.x + delta,
        point1.y,
        point2.x - delta,
        point2.y,
        point2.x,
        point2.y
      )
    }
    lineTo(point2.x, point2.y)
  }
  return path
}

private fun cubicPathY(point1: Offset, point2: Offset, position: Int): Path {
  val path = Path().apply {
    moveTo(point1.x, point1.y)
    val delta = (point2.y - point1.y) * .5f
    when (position) {
      0 -> cubicTo(
        point1.x,
        point1.y,
        point2.x,
        point2.y - delta,
        point2.x,
        point2.y
      )
      2 -> cubicTo(
        point1.x,
        point1.y + delta,
        point2.x,
        point2.y,
        point2.x,
        point2.y
      )
      else -> cubicTo(
        point1.x,
        point1.y + delta,
        point2.x,
        point2.y - delta,
        point2.x,
        point2.y
      )
    }
    lineTo(point2.x, point2.y)
  }
  return path
}
