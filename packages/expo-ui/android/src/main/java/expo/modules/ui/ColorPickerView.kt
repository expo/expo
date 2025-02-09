package expo.modules.ui

import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.ui.graphics.Brush
import kotlin.math.roundToInt

data class ColorPickerProps(
  val selection: MutableState<Int> = mutableStateOf(Color.RED),
  val label: MutableState<String?> = mutableStateOf(null),
  val supportsOpacity: MutableState<Boolean> = mutableStateOf(false)
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
class ColorPickerView(context: Context, appContext: AppContext) : ExpoComposeView<ColorPickerProps>(context, appContext) {
  override val props = ColorPickerProps()
  private val onValueChanged by EventDispatcher()

  init {
    setContent {
      var showSheet by remember { mutableStateOf(false) }
      val currentColor = remember(props.selection.value) {
        ComposeColor(props.selection.value)
      }
      var alpha by remember { mutableFloatStateOf(currentColor.alpha) }

      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        if (props.label.value != null) {
          Text(
            props.label.value!!,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f)
          )
          Spacer(modifier = Modifier.width(8.dp))
        }
        Box(
          modifier = Modifier
            .size(24.dp)
            .clip(CircleShape)
            .background(currentColor)
            .clickable {
              showSheet = true
            }
        )
      }

      if (showSheet) {
        ModalBottomSheet(
          onDismissRequest = { showSheet = false },
          sheetState = rememberModalBottomSheetState()
        ) {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .padding(horizontal = 16.dp)
          ) {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text("Select a color",
                style = MaterialTheme.typography.headlineSmall,
                modifier = Modifier.weight(1f))
              IconButton(onClick = { showSheet = false }) {
                Icon(Icons.Default.Close, "Close")
              }
            }

            Spacer(modifier = Modifier.height(16.dp))

            ColorSpectrumPicker(
              initialColor = currentColor.toArgb(),
              alpha = alpha,
              onValueChanged = { newColor ->
                val argbColor = newColor.toArgb()
                props.selection.value = argbColor
                onValueChanged(mapOf("value" to colorToHex(argbColor, props.supportsOpacity.value)))
              }
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (props.supportsOpacity.value) {
              Text("Opacity", style = MaterialTheme.typography.bodyMedium)
              Slider(
                value = alpha,
                onValueChange = { newAlpha ->
                  alpha = newAlpha
                  val updatedColor = currentColor.copy(alpha = newAlpha)
                  val argbColor = updatedColor.toArgb()
                  props.selection.value = argbColor
                  onValueChanged(mapOf("value" to colorToHex(argbColor, true)))
                },
                valueRange = 0f..1f
              )
              Spacer(modifier = Modifier.height(16.dp))
            } else {
              LaunchedEffect(currentColor) {
                if (currentColor.alpha != 1f) {
                  val opaqueColor = currentColor.copy(alpha = 1f)
                  props.selection.value = opaqueColor.toArgb()
                }
              }
            }
          }
        }
      }
    }
  }

  private fun colorToHex(argb: Int, includeAlpha: Boolean): String {
    return if (includeAlpha) {
      String.format("#%08X", argb)
    } else {
      // Mask out the alpha channel and only keep RGB
      String.format("#%06X", 0xFFFFFF and argb)
    }
  }
}

@Composable
fun ColorSpectrumPicker(
  initialColor: Int,
  alpha: Float,
  onValueChanged: (ComposeColor) -> Unit
) {
  val hsv = FloatArray(3)
  Color.colorToHSV(initialColor, hsv)

  var currentHue by remember { mutableStateOf(hsv[0]) }
  var currentSaturation by remember { mutableStateOf(hsv[1]) }
  val spectrumHeight = 300.dp
  val spectrumWidth = 400.dp

  val currentColor by remember(currentHue, currentSaturation, alpha) {
    derivedStateOf {
      hsvToColor(currentHue, currentSaturation, 1f).copy(alpha = alpha)
    }
  }

  Box(
    modifier = Modifier
      .width(spectrumWidth)
      .height(spectrumHeight)
      .clip(RoundedCornerShape(8.dp))
      .background(ComposeColor.White)
  ) {
    Canvas(
      modifier = Modifier
        .matchParentSize()
        .pointerInput(Unit) {
          detectDragGestures(
            onDragStart = { offset ->
              val x = offset.x.coerceIn(0f, size.width.toFloat())
              val y = offset.y.coerceIn(0f, size.height.toFloat())

              currentHue = (y / size.height) * 360f
              currentSaturation = 1f - (x / size.width)
              onValueChanged(currentColor)
            },
            onDrag = { change, _ ->
              val x = change.position.x.coerceIn(0f, size.width.toFloat())
              val y = change.position.y.coerceIn(0f, size.height.toFloat())

              currentHue = (y / size.height) * 360f
              currentSaturation = 1f - (x / size.width)
              onValueChanged(currentColor)
            }
          )
        }
    ) {
      val hueGradient = Brush.verticalGradient(
        colors = listOf(
          hsvToColor(0f, 1f, 1f),
          hsvToColor(60f, 1f, 1f),
          hsvToColor(120f, 1f, 1f),
          hsvToColor(180f, 1f, 1f),
          hsvToColor(240f, 1f, 1f),
          hsvToColor(300f, 1f, 1f),
          hsvToColor(360f, 1f, 1f)
        )
      )

      val saturationGradient = Brush.horizontalGradient(
        colors = listOf(
          ComposeColor.White.copy(alpha = 0f),
          ComposeColor.White
        )
      )

      drawRect(brush = hueGradient)
      drawRect(brush = saturationGradient)
    }

    Box(
      modifier = Modifier
        .size(24.dp)
        .offset(
          x = (spectrumWidth.value * (1 - currentSaturation)).dp - 12.dp,
          y = (spectrumHeight.value * (currentHue / 360f)).dp - 12.dp
        )
        .clip(CircleShape)
        .background(currentColor)
        .border(2.dp, ComposeColor.White, CircleShape)
    )
  }
}

fun hsvToColor(hue: Float, saturation: Float, value: Float): ComposeColor {
  val hsv = floatArrayOf(hue, saturation, value)
  return ComposeColor(Color.HSVToColor(hsv))
}