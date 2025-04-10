package expo.modules.imagepicker.exporters

import android.content.Context
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert
import org.junit.Test
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class DimensionsExporterTests {
  @Test
  fun return_correct_dimensions_for_landscape_photos() {
    val assets = (0..8).map { "landscape_$it.jpg" }
    verifyDimensions(assets, 160, 120)
  }

  @Test
  fun return_correct_dimensions_for_portrait_photos() {
    val assets = (0..8).map { "portrait_$it.jpg" }
    verifyDimensions(assets, 120, 160)
  }

  fun verifyDimensions(assets: List<String>, expectedWidth: Int, expectedHeight: Int) {
    assets.forEach { asset ->
      val file = openTestFile(asset)
      val dimensionsExporter = DimensionsExporter(file)

      Assert.assertEquals(dimensionsExporter.width, expectedWidth)
      Assert.assertEquals(dimensionsExporter.height, expectedHeight)

      file.delete()
    }
  }
}

fun openTestFile(fileName: String): File {
  val context = InstrumentationRegistry.getInstrumentation().targetContext
  return copyAssetToTempFile(fileName, context)
}

fun copyAssetToTempFile(assetFileName: String, context: Context): File {
  // Get the AssetManager
  val assetManager = context.assets

  // Define the output file in the app's cache directory
  val cacheDir = context.cacheDir // Cache directory path
  val outputFile = File(cacheDir, assetFileName)

  try {
    // Open the input stream to the asset
    assetManager.open(assetFileName).use { inputStream ->
      FileOutputStream(outputFile).use { outputStream ->
        inputStream.copyTo(outputStream)
      }
    }
  } catch (e: IOException) {
    Assert.fail("Failed to copy asset to temp file - ${e.message}")
  }

  return outputFile
}
