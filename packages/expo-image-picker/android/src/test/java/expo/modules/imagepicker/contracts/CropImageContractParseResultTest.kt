package expo.modules.imagepicker.contracts

import android.app.Activity
import com.canhub.cropper.CropImage
import expo.modules.imagepicker.ensureCropOutputDirectoryExists
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.io.FileNotFoundException
import kotlin.io.path.createTempDirectory

/**
 * @see https://github.com/expo/expo/issues/49802
 */
@RunWith(RobolectricTestRunner::class)
internal class CropImageContractParseResultTest {
  @Test
  fun parseResult_mapsCropperErrorWithNullUriToError() {
    assertEquals(Activity.RESULT_CANCELED, CROP_IMAGE_PARSE_CANCELLED_CODE)
    assertEquals(CropImage.CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE, CROP_IMAGE_PARSE_ERROR_CODE)

    val result = CropImage.ActivityResult(
      originalUri = null,
      uriContent = null,
      error = FileNotFoundException("open failed: ENOENT"),
      cropPoints = floatArrayOf(),
      cropRect = null,
      rotation = 0,
      wholeImageRect = null,
      sampleSize = 1
    )

    val mapped = mapCropImageParseResult(
      CropImage.CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE,
      result
    )

    assertSame(ImagePickerContractResult.Error, mapped)
  }

  @Test
  fun parseResult_mapsCancelledToCancelled() {
    val mapped = mapCropImageParseResult(Activity.RESULT_CANCELED, null)
    assertSame(ImagePickerContractResult.Cancelled, mapped)
  }

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
}
