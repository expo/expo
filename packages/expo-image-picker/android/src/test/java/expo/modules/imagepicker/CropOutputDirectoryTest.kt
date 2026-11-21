package expo.modules.imagepicker

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import kotlin.io.path.createTempDirectory

/**
 * @see https://github.com/expo/expo/issues/49802
 */
internal class CropOutputDirectoryTest {
  @Test
  fun ensureCropOutputDirectoryExists_recreatesDeletedParent() {
    val root = createTempDirectory("image-picker-crop").toFile()
    try {
      val parent = File(root, "ImagePicker")
      val outputFile = File(parent, "crop.png")
      assertTrue(parent.mkdirs())
      assertTrue(parent.deleteRecursively())
      assertFalse(parent.exists())

      ensureCropOutputDirectoryExists(outputFile.absolutePath)

      assertTrue(parent.isDirectory)
    } finally {
      root.deleteRecursively()
    }
  }

  @Test
  fun ensureCropOutputDirectoryExists_ignoresNullPath() {
    ensureCropOutputDirectoryExists(null)
  }
}
