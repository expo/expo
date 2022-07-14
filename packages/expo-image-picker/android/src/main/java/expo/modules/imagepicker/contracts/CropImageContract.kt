package expo.modules.imagepicker.contracts

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
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
  private val appContextProvider: AppContextProvider,
) : AppContextActivityResultContract<CropImageContractOptions, ImagePickerContractResult> {
  override fun createIntent(context: Context, input: CropImageContractOptions) = Intent(context, CropImageActivity::class.java).apply {
    val mediaType = expo.modules.imagepicker.getType(context.contentResolver, input.sourceUri)
    val compressFormat = mediaType.toBitmapCompressFormat()

    /**
     * for `IMAGE LIBRARY` we need to create a new file as up to this point we've been operating on the original media asset
     * for `CAMERA` we do not have to do it as it's already been created at the beginning of the picking process
     */
    val outputUri: Uri = if (input.pickingSource == PickingSource.IMAGE_LIBRARY) {
      createOutputFile(context.cacheDir, compressFormat.toImageFileExtension()).toUri()
    } else {
      input.sourceUri
    }

    putExtra(
      CropImage.CROP_IMAGE_EXTRA_BUNDLE,
      bundleOf(
        CropImage.CROP_IMAGE_EXTRA_SOURCE to input.sourceUri,
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

          validate()
        }
      )
    )
  }

  override fun parseResult(input: CropImageContractOptions, resultCode: Int, intent: Intent?): ImagePickerContractResult {
    val result = intent?.getParcelableExtra<CropImage.ActivityResult?>(CropImage.CROP_IMAGE_EXTRA_RESULT)
    if (resultCode == Activity.RESULT_CANCELED || result == null) {
      return ImagePickerContractResult.Cancelled()
    }
    val targetUri = requireNotNull(result.uriContent)
    val contentResolver = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null" }.contentResolver
    runBlocking { copyExifData(input.sourceUri, targetUri.toFile(), contentResolver) }
    return ImagePickerContractResult.Success(listOf(MediaType.IMAGE to targetUri), input.pickingSource)
  }
}

internal data class CropImageContractOptions(
  val sourceUri: Uri,
  val options: ImagePickerOptions,
  val pickingSource: PickingSource,
) : Serializable
