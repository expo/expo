package expo.modules.meshgradient

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.State
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Canvas
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.VertexMode
import androidx.compose.ui.graphics.Vertices
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.scale
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class Resolution(
  @Field
  val x: Int = 8,

  @Field
  val y: Int = 8
) : Record

data class MeshGradientViewProps(
  val columns: MutableState<Int> = mutableIntStateOf(0),
  val rows: MutableState<Int> = mutableIntStateOf(0),
  val points: MutableState<List<Pair<Float, Float>>> = mutableStateOf(listOf()),
  val colors: MutableState<List<Int>> = mutableStateOf(listOf()),
  val resolution: MutableState<Resolution> = mutableStateOf(Resolution()),
  val smoothsColors: MutableState<Boolean> = mutableStateOf(true)
) : ComposeProps

@SuppressLint("ViewConstructor")
class MeshGradientView(context: Context, appContext: AppContext) : ExpoComposeView<MeshGradientViewProps>(context, appContext, withHostingView = true) {
  override val props = MeshGradientViewProps()
  private val paint = Paint()

  @Composable
  override fun Content() {
    val pointData = pointsFromProps()

    Canvas(modifier = Modifier.fillMaxSize()) {
      drawIntoCanvas { canvas: Canvas ->
        scale(
          scaleX = size.width,
          scaleY = size.height,
          pivot = Offset.Zero
        ) {
          canvas.drawVertices(
            vertices = Vertices(
              vertexMode = VertexMode.Triangles,
              positions = pointData.value.offsets,
              textureCoordinates = pointData.value.offsets,
              colors = pointData.value.colors,
              indices = pointData.value.indices
            ),
            blendMode = BlendMode.Dst,
            paint = paint
          )
        }
      }
    }
  }

  @Composable
  private fun pointsFromProps(): State<PointData> =
    remember {
      derivedStateOf {
        val points = buildList {
          val numRows = props.rows.value
          val numCols = props.columns.value
          val colors = props.colors.value
          val definedPoints = props.points.value
          for (row in 0 until numRows) {
            val rowList = buildList {
              for (col in 0 until numCols) {
                val index = row * numCols + col
                if (index < definedPoints.size && index < colors.size) {
                  val (x, y) = definedPoints[index]
                  val color = Color(colors[index])
                  add(Pair(Offset(x, y), color))
                }
              }
            }
            add(rowList)
          }
        }
        return@derivedStateOf PointData(points, props.resolution.value.x, props.resolution.value.y, props.smoothsColors.value)
      }
    }
}
