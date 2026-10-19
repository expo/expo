package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import androidx.core.net.toUri
import androidx.core.os.bundleOf
import com.canhub.cropper.CropImage
import com.canhub.cropper.CropImageOptions
import com.canhub.cropper.CropImageView
import expo.modules.imagepicker.CropShape
import expo.modules.imagepicker.ExpoCropImageActivity
import expo.modules.imagepicker.ImagePickerOptions
import expo.modules.imagepicker.MediaType
import expo.modules.imagepicker.copyExifData
import expo.modules.imagepicker.getContentUri
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.providers.AppContextProvider
import kotlinx.coroutines.runBlocking
import java.io.File
import java.io.Serializable

internal class CropImageContract(
  private val appContextProvider: AppContextProvider
) : AppContextActivityResultContract<CropImageContractOptions, ImagePickerContractResult> {
  override fun createIntent(context: Context, input: CropImageContractOptions) = Intent(context, ExpoCropImageActivity::class.java).apply {
    val outputUri = input.outputFile.getContentUri(context)

    putExtra(
      CropImage.CROP_IMAGE_EXTRA_BUNDLE,
      bundleOf(
        CropImage.CROP_IMAGE_EXTRA_SOURCE to input.sourceUri.toUri(),
        CropImage.CROP_IMAGE_EXTRA_OPTIONS to CropImageOptions().apply {
          outputCompressFormat = input.compressFormat
          outputCompressQuality = (input.options.quality * 100).toInt()

          this.customOutputUri = outputUri

          input.options.aspect?.let { (x, y) ->
            aspectRatioX = x
            aspectRatioY = y
            fixAspectRatio = true
            initialCropWindowPaddingRatio = 0f
          }

          cropShape = when (input.options.shape) {
            CropShape.RECTANGLE -> CropImageView.CropShape.RECTANGLE
            CropShape.OVAL -> CropImageView.CropShape.OVAL
          }
        }
      )
    )
  }

  override fun parseResult(input: CropImageContractOptions, resultCode: Int, intent: Intent?): ImagePickerContractResult {
    if (resultCode == Activity.RESULT_CANCELED) {
      return ImagePickerContractResult.Cancelled
    }
    if (resultCode == CropImage.CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE) {
      return ImagePickerContractResult.Error
    }
    if (resultCode != Activity.RESULT_OK) {
      return ImagePickerContractResult.Error
    }
    val reactContext = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null" }
    val targetUri = input.outputFile.getContentUri(reactContext)
    runBlocking { copyExifData(input.sourceUri.toUri(), input.outputFile, reactContext.contentResolver) }
    return ImagePickerContractResult.Success(listOf(MediaType.IMAGE to targetUri))
  }
}

internal data class CropImageContractOptions(
  val sourceUri: String,
  val options: ImagePickerOptions,
  val outputFile: File,
  val compressFormat: Bitmap.CompressFormat
) : Serializable
