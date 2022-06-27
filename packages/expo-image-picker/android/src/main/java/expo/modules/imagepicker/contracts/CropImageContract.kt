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
import expo.modules.imagepicker.PickingSource
import expo.modules.imagepicker.copyExifData
import expo.modules.imagepicker.createOutputFile
import expo.modules.imagepicker.toBitmapCompressFormat
import expo.modules.imagepicker.toImageFileExtension
import expo.modules.kotlin.providers.AppContextProvider
import kotlinx.coroutines.runBlocking

internal class CropImageContract(
  private val appContextProvider: AppContextProvider,
  private val sourceUri: Uri,
  private val options: ImagePickerOptions,
  private val pickingSource: PickingSource
) : ImagePickerContract() {
  override fun createIntent(context: Context, input: Any?) = Intent(context, CropImageActivity::class.java).apply {
    // for [IMAGE_LIBRARY] we need to create a new file as up to this point we've been operating on the original media asset
    // for [CAMERA] we do not have to do it as it's already been created at the beginning of the picking process
    val needCreateNewFile = pickingSource == PickingSource.IMAGE_LIBRARY
    val mediaType = expo.modules.imagepicker.getType(context.contentResolver, sourceUri)

    val compressFormat = mediaType.toBitmapCompressFormat()

    val outputUri: Uri = if (needCreateNewFile) {
      createOutputFile(context.cacheDir, compressFormat.toImageFileExtension()).toUri()
    } else {
      sourceUri
    }

    putExtra(
      CropImage.CROP_IMAGE_EXTRA_BUNDLE,
      bundleOf(
        CropImage.CROP_IMAGE_EXTRA_SOURCE to sourceUri,
        CropImage.CROP_IMAGE_EXTRA_OPTIONS to CropImageOptions().apply {
          outputCompressFormat = compressFormat
          outputCompressQuality = (this@CropImageContract.options.quality * 100).toInt()
          this.outputUri = outputUri

          this@CropImageContract.options.aspect?.let { (x, y) ->
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

  override fun parseResult(resultCode: Int, intent: Intent?): ImagePickerContractResult {
    val result = intent?.getParcelableExtra<CropImage.ActivityResult?>(CropImage.CROP_IMAGE_EXTRA_RESULT)
    if (resultCode == Activity.RESULT_CANCELED || result == null) {
      return ImagePickerContractResult.Cancelled()
    }
    val targetUri = requireNotNull(result.uri)
    val contentResolver = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null" }.contentResolver
    runBlocking { copyExifData(sourceUri, targetUri.toFile(), contentResolver) }
    return ImagePickerContractResult.Success(MediaType.IMAGE to targetUri)
  }
}
