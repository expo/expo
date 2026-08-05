package host.exp.exponent.home.qrScanner

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun QRScannerOverlay(modifier: Modifier = Modifier) {
  val configuration = LocalConfiguration.current
  val screenWidth = configuration.screenWidthDp.dp
  val screenHeight = configuration.screenHeightDp.dp
  val minDimension = minOf(screenWidth, screenHeight)
  val scannerSize = (minDimension * 0.7f).coerceIn(150.dp, 250.dp)

  Box(
    modifier = modifier.fillMaxSize(),
    contentAlignment = Alignment.Center
  ) {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      Canvas(
        modifier = Modifier.size(scannerSize)
      ) {
        val strokeWidth = 6f
        val cornerLength = 50f
        val squareSize = size.minDimension
        val cornerRadius = 16f

        // Top-left corner
        drawRoundedCorner(
          offset = Offset(0f, 0f),
          startAngle = 180f,
          strokeWidth = strokeWidth,
          cornerRadius = cornerRadius,
          horizontalLineStart = Offset(cornerRadius, 0f),
          horizontalLineEnd = Offset(cornerLength, 0f),
          verticalLineStart = Offset(0f, cornerRadius),
          verticalLineEnd = Offset(0f, cornerLength)
        )

        // Top-right corner
        drawRoundedCorner(
          offset = Offset(squareSize - cornerRadius * 2, 0f),
          startAngle = 270f,
          strokeWidth = strokeWidth,
          cornerRadius = cornerRadius,
          horizontalLineStart = Offset(squareSize - cornerRadius, 0f),
          horizontalLineEnd = Offset(squareSize - cornerLength, 0f),
          verticalLineStart = Offset(squareSize, cornerRadius),
          verticalLineEnd = Offset(squareSize, cornerLength)
        )

        // Bottom-left corner
        drawRoundedCorner(
          offset = Offset(0f, squareSize - cornerRadius * 2),
          startAngle = 90f,
          strokeWidth = strokeWidth,
          cornerRadius = cornerRadius,
          horizontalLineStart = Offset(cornerRadius, squareSize),
          horizontalLineEnd = Offset(cornerLength, squareSize),
          verticalLineStart = Offset(0f, squareSize - cornerRadius),
          verticalLineEnd = Offset(0f, squareSize - cornerLength)
        )

        // Bottom-right corner
        drawRoundedCorner(
          offset = Offset(squareSize - cornerRadius * 2, squareSize - cornerRadius * 2),
          startAngle = 0f,
          strokeWidth = strokeWidth,
          cornerRadius = cornerRadius,
          horizontalLineStart = Offset(squareSize - cornerRadius, squareSize),
          horizontalLineEnd = Offset(squareSize - cornerLength, squareSize),
          verticalLineStart = Offset(squareSize, squareSize - cornerRadius),
          verticalLineEnd = Offset(squareSize, squareSize - cornerLength)
        )
      }

      Text(
        text = "Scan an Expo Go QR code",
        color = Color.White,
        fontSize = 12.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(top = 24.dp)
      )
    }
  }
}
