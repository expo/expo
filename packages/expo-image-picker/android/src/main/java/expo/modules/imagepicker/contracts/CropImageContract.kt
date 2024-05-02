package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.net.toFile
import androidx.core.net.toUri
import androidx.core.os.bundleOf
import com.canhub.cropper.CropImage
import com.canhub.cropper.CropImageActivity
import com.canhub.cropper.CropImageOptions
import expo.modules.imagepicker.ImagePickerOptions
import expo.modules.imagepicker.MediaType
import expo.modules.imagepicker.copyExifData
import expo.modules.imagepicker.createOutputFile
import expo.modules.imagepicker.toBitmapCompressFormat
import expo.modules.imagepicker.toImageFileExtension
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.providers.AppContextProvider
import kotlinx.coroutines.runBlocking
import java.io.Serializable

internal class CropImageContract(
  private val appContextProvider: AppContextProvider
) : AppContextActivityResultContract<CropImageContractOptions, ImagePickerContractResult> {
  override fun createIntent(context: Context, input: CropImageContractOptions) = Intent(context, CropImageActivity::class.java).apply {
    val mediaType = expo.modules.imagepicker.getType(context.contentResolver, input.sourceUri.toUri())
    val compressFormat = mediaType.toBitmapCompressFormat()
    val cacheDirectory = appContextProvider.appContext.cacheDirectory
    val outputUri = createOutputFile(cacheDirectory, compressFormat.toImageFileExtension()).toUri()

    putExtra(
      CropImage.CROP_IMAGE_EXTRA_BUNDLE,
      bundleOf(
        CropImage.CROP_IMAGE_EXTRA_SOURCE to input.sourceUri.toUri(),
        CropImage.CROP_IMAGE_EXTRA_OPTIONS to CropImageOptions().apply {
          outputCompressFormat = compressFormat
          outputCompressQuality = (input.options.quality * 100).toInt()

          this.customOutputUri = outputUri

          input.options.aspect?.let { (x, y) ->
            aspectRatioX = x
            aspectRatioY = y
            fixAspectRatio = true
            initialCropWindowPaddingRatio = 0f
          }
        }
      )
    )
  }

  override fun parseResult(input: CropImageContractOptions, resultCode: Int, intent: Intent?): ImagePickerContractResult {
    val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      intent?.getParcelableExtra(CropImage.CROP_IMAGE_EXTRA_RESULT, CropImage.ActivityResult::class.java)
    } else {
      @Suppress("DEPRECATION")
      intent?.getParcelableExtra(CropImage.CROP_IMAGE_EXTRA_RESULT)
    }
    if (resultCode == Activity.RESULT_CANCELED || result == null) {
      return ImagePickerContractResult.Cancelled
    }
    val targetUri = requireNotNull(result.uriContent)
    val contentResolver = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null" }.contentResolver
    runBlocking { copyExifData(input.sourceUri.toUri(), targetUri.toFile(), contentResolver) }
    return ImagePickerContractResult.Success(listOf(MediaType.IMAGE to targetUri))
  }
}

internal data class CropImageContractOptions(
  val sourceUri: String,
  val options: ImagePickerOptions
) : Serializable
