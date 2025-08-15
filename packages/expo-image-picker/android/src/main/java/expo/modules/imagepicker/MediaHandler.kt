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
      fileName = fileData?.fileName ?: outputFile.name,
      fileSize = fileData?.fileSize ?: outputFile.length(),
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

    try {
      val metadataRetriever = MediaMetadataRetriever().apply {
        setDataSource(context, outputUri)
      }

      val fileData = getAdditionalFileData(sourceUri)
      val mimeType = getType(context.contentResolver, sourceUri)

      // Extract basic metadata
      var width = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
      var height = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
      val rotation = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)

      // Android returns the encoded width/height which do not take the display rotation into
      // account. For videos recorded in portrait mode the encoded dimensions are often landscape
      // (e.g. 1920x1080) paired with a 90°/270° rotation flag.  iOS adjusts these values before
      // reporting them, so to keep the behaviour consistent across platforms we swap the width
      // and height when the rotation indicates the video should be displayed in portrait.
      if (rotation % 180 != 0) {
        width = height.also { height = width }
      }

      return ImagePickerAsset(
        type = MediaType.VIDEO,
        uri = outputUri.toString(),
        width = width,
        height = height,
        fileName = fileData?.fileName,
        fileSize = fileData?.fileSize,
        mimeType = mimeType,
        duration = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_DURATION),
        rotation = rotation,
        assetId = sourceUri.getMediaStoreAssetId()
      )
    } catch (cause: FailedToExtractVideoMetadataException) {
      throw FailedToExtractVideoMetadataException(outputFile, cause)
    }
  }
}

data class AdditionalFileData(
  val fileName: String?,
  val fileSize: Long?
)
