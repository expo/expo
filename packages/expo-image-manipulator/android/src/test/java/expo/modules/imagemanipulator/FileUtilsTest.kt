package expo.modules.imagemanipulator

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import kotlin.io.path.createTempDirectory

@RunWith(RobolectricTestRunner::class)
class FileUtilsTest {
  @Test
  fun generateRandomOutputPathUsesProvidedCacheDirectory() {
    val cacheDirectory = createTempDirectory("image-manipulator-cache").toFile()

    val outputPath = FileUtils.generateRandomOutputPath(cacheDirectory, ImageFormat.JPEG)
    val outputFile = File(outputPath)
    val expectedDirectory = File(cacheDirectory, "ImageManipulator")

    assertEquals(expectedDirectory.canonicalPath, outputFile.parentFile?.canonicalPath)
    assertTrue(expectedDirectory.isDirectory)
    assertTrue(outputFile.name.endsWith(".jpg"))
  }
}
