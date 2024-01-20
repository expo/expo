package expo.modules.imagepicker

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import androidx.core.net.toUri
import expo.modules.imagepicker.exporters.CompressionImageExporter
import expo.modules.imagepicker.exporters.ImageExporter
import expo.modules.imagepicker.exporters.RawImageExporter
import expo.modules.kotlin.providers.AppContextProvider
import java.io.File

internal class MediaHandler(
  private val appContextProvider: AppContextProvider
) {
  private val context: Context
    get() = requireNotNull(appContextProvider.appContext.reactContext) { "React Application Context is null" }

  internal suspend fun readExtras(
    bareResult: List<Pair<MediaType, Uri>>,
    options: ImagePickerOptions
  ): ImagePickerResponse {
    val results = bareResult.map { (mediaType, uri) ->
      when (mediaType) {
        MediaType.VIDEO -> handleVideo(uri)
        MediaType.IMAGE -> handleImage(uri, options)
      }
    }

    return ImagePickerResponse(
      canceled = false,
      assets = results
    )
  }

  private val cacheDirectory: File
    get() = appContextProvider.appContext.cacheDirectory

  private suspend fun handleImage(
    sourceUri: Uri,
    options: ImagePickerOptions
  ): ImagePickerAsset {
    val exporter: ImageExporter = if (options.quality == ImagePickerConstants.MAXIMUM_QUALITY) {
      RawImageExporter()
    } else {
      CompressionImageExporter(appContextProvider, options.quality)
    }
    val mimeType = getType(context.contentResolver, sourceUri)
    val outputFile = createOutputFile(cacheDirectory, mimeType.toImageFileExtension())

    val exportedImage = exporter.exportAsync(sourceUri, outputFile, context.contentResolver)
    val base64 = options.base64.takeIf { it }
      ?.let { exportedImage.data(context.contentResolver) }
      ?.let { Base64.encodeToString(it.toByteArray(), Base64.NO_WRAP) }
    val exif = options.exif.takeIf { it }
      ?.let { exportedImage.exif(context.contentResolver) }

    val fileData = getAdditionalFileData(sourceUri)

    return ImagePickerAsset(
      type = MediaType.IMAGE,
      uri = Uri.fromFile(outputFile).toString(),
      width = exportedImage.width,
      height = exportedImage.height,
      fileName = fileData?.fileName,
      filesize = fileData?.filesize,
      mimeType = mimeType,
      base64 = base64,
      exif = exif,
      assetId = sourceUri.getMediaStoreAssetId()
    )
  }

  private fun getAdditionalFileData(uri: Uri): AdditionalFileData? = context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
    val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
    cursor.moveToFirst()

    val name: String? = cursor.getString(nameIndex)
    val size = cursor.getLong(sizeIndex)
    AdditionalFileData(
      name,
      size
    )
  }

  private suspend fun handleVideo(
    sourceUri: Uri
  ): ImagePickerAsset {
    val outputFile = createOutputFile(cacheDirectory, ".mp4")
    copyFile(sourceUri, outputFile, context.contentResolver)
    val outputUri = outputFile.toUri()

    return try {
      val metadataRetriever = MediaMetadataRetriever().apply {
        setDataSource(context, outputUri)
      }

      val fileData = getAdditionalFileData(sourceUri)
      val mimeType = getType(context.contentResolver, sourceUri)

      return ImagePickerAsset(
        type = MediaType.VIDEO,
        uri = outputUri.toString(),
        width = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH),
        height = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT),
        fileName = fileData?.fileName,
        filesize = fileData?.filesize,
        mimeType = mimeType,
        duration = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_DURATION),
        rotation = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION),
        assetId = sourceUri.getMediaStoreAssetId()
      )
    } catch (cause: FailedToExtractVideoMetadataException) {
      throw FailedToExtractVideoMetadataException(outputFile, cause)
    }
  }
}

data class AdditionalFileData(
  val fileName: String?,
  val filesize: Long?
)
