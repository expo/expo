package expo.modules.devmenu.fab

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.composeunstyled.Icon
import com.composeunstyled.Text
import expo.modules.devmenu.R
import kotlinx.coroutines.delay

private val FabBlue = Color(0xFF007AFF)

@Composable
fun FloatingActionButtonContent(
  modifier: Modifier = Modifier,
  isPressed: Boolean = false,
  isDragging: Boolean = false,
  isIdle: Boolean = false
) {
  val scale by animateFloatAsState(
    targetValue = if (isPressed && !isDragging) 0.9f else 1f,
    label = "pressScale"
  )

  val idleAlpha by animateFloatAsState(
    targetValue = if (isIdle) 0.5f else 1f,
    label = "idleAlpha"
  )

  val idleSaturation by animateFloatAsState(
    targetValue = if (isIdle) 0f else 1f,
    label = "idleSaturation"
  )

  var showLabel by remember { mutableStateOf(true) }

  LaunchedEffect(Unit) {
    delay(10_000)
    showLabel = false
  }

  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    modifier = modifier
      .scale(scale)
      .graphicsLayer {
        alpha = idleAlpha
      }
      .drawWithContent {
        val colorMatrix = android.graphics.ColorMatrix()
        colorMatrix.setSaturation(idleSaturation)
        val paint = android.graphics.Paint().apply {
          colorFilter = android.graphics.ColorMatrixColorFilter(colorMatrix)
        }
        drawContext.canvas.nativeCanvas.saveLayer(null, paint)
        drawContent()
        drawContext.canvas.nativeCanvas.restore()
      }
  ) {
    Box(
      contentAlignment = Alignment.Center,
      modifier = Modifier
        .shadow(
          elevation = 8.dp,
          shape = CircleShape,
          ambientColor = Color.Black.copy(alpha = 0.4f),
          spotColor = Color.Black.copy(alpha = 0.4f)
        )
        .size(52.dp)
        .border(4.dp, FabBlue.copy(alpha = 0.3f), CircleShape)
        .padding(4.dp)
        .background(FabBlue, CircleShape)
    ) {
      Icon(
        painter = painterResource(R.drawable.gear_fill),
        contentDescription = "Tools",
        tint = Color.White,
        modifier = Modifier.size(26.dp)
      )
    }

    AnimatedVisibility(
      visible = showLabel,
      exit = fadeOut() + scaleOut()
    ) {
      Box(
        modifier = Modifier
          .padding(top = 6.dp)
          .shadow(4.dp, RoundedCornerShape(percent = 50))
          .background(Color.White, RoundedCornerShape(percent = 50))
          .padding(horizontal = 10.dp, vertical = 4.dp)
      ) {
        Text(
          text = "Tools",
          color = Color.Black,
          fontSize = 11.sp,
          fontWeight = FontWeight.SemiBold
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
fun FloatingActionButtonContentPreview() {
  Column(
    modifier = Modifier.padding(32.dp),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    FloatingActionButtonContent()
  }
}
