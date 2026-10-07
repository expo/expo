package expo.modules.camera.analyzers

import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScanner
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test

@OptIn(ExperimentalGetImage::class)
class BarcodeAnalyzerTest {
  private val scanner = mockk<BarcodeScanner>(relaxed = true)
  private val analyzer = BarcodeAnalyzer(scanner) {}

  @Test
  fun closesFrameWithoutImage() {
    val frame = mockk<ImageProxy>(relaxed = true) {
      every { image } returns null
    }

    analyzer.analyze(frame)

    verify(exactly = 1) { frame.close() }
  }

  @Test
  fun closingAnalyzerClosesScanner() {
    analyzer.close()

    verify(exactly = 1) { scanner.close() }
  }
}
