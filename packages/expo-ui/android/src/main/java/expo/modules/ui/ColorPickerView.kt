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
import kotlin.math.roundToInt
import androidx.compose.ui.graphics.Brush


// 🎨 ColorPicker Props
data class ColorPickerProps(
    val selectedColor: MutableState<ComposeColor> = mutableStateOf(ComposeColor.Red),
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
            val selectedColor = props.selectedColor
            var alpha by remember { mutableStateOf(1f) }

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
                        .background(selectedColor.value)
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
                        // Header moved up with less spacing
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

                        // Color Spectrum Picker with corrected callback
                        ColorSpectrumPicker(
                            selectedColor = selectedColor.value,
                            alpha = alpha,
                            onValueChanged = { color ->
                                selectedColor.value = color
                                onValueChanged(mapOf("hex" to colorToHex(color)))
                            }
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Only show opacity controls if supported
                        if (props.supportsOpacity.value) {
                            Text("Opacity", style = MaterialTheme.typography.bodyMedium)
                            Slider(
                                value = alpha,
                                onValueChange = { newAlpha ->
                                    alpha = newAlpha
                                    val currentColor = selectedColor.value
                                    selectedColor.value = currentColor.copy(alpha = newAlpha)
                                    onValueChanged(mapOf("hex" to colorToHex(selectedColor.value)))
                                },
                                valueRange = 0f..1f
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                        } else {
                            // Force alpha to 1f when opacity is not supported
                            LaunchedEffect(selectedColor.value) {
                                if (selectedColor.value.alpha != 1f) {
                                    selectedColor.value = selectedColor.value.copy(alpha = 1f)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    private fun colorToHex(color: ComposeColor): String {
        val finalColor = if (!props.supportsOpacity.value) {
            color.copy(alpha = 1f)
        } else {
            color
        }
        return String.format("#%08X", finalColor.toArgb())
    }
}

// 🎨 Color Spectrum Picker (2D Hue + Saturation)
@Composable
fun ColorSpectrumPicker(
    selectedColor: ComposeColor,
    alpha: Float,
    onValueChanged: (ComposeColor) -> Unit
) {
    var hue by remember { mutableStateOf(0f) }
    var saturation by remember { mutableStateOf(1f) }
    val spectrumHeight = 300.dp
    val spectrumWidth = 400.dp

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
                    detectDragGestures { change, _ ->
                        val x = change.position.x.coerceIn(0f, size.width.toFloat())
                        val y = change.position.y.coerceIn(0f, size.height.toFloat())
                        
                        hue = (y / size.height) * 360f
                        saturation = 1f - (x / size.width)
                        
                        onValueChanged(hsvToColor(hue, saturation, 1f).copy(alpha = alpha))
                    }
                }
        ) {
            // Fixed gradients with proper float values
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

        // Cursor
        Box(
            modifier = Modifier
                .size(24.dp)
                .offset(
                    x = (spectrumWidth.value * (1 - saturation)).dp - 12.dp,
                    y = (spectrumHeight.value * (hue / 360f)).dp - 12.dp
                )
                .clip(CircleShape)
                .background(selectedColor)
                .border(2.dp, ComposeColor.White, CircleShape)
        )
    }
}

// 🔄 Convert HSV to ComposeColor
fun hsvToColor(hue: Float, saturation: Float, value: Float): ComposeColor {
    val hsv = floatArrayOf(hue, saturation, value)
    return ComposeColor(Color.HSVToColor(hsv))
}
