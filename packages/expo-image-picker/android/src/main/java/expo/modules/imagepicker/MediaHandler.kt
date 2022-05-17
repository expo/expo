package expo.modules.imagepicker

import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Base64
import expo.modules.imagepicker.exporters.CompressionImageExporter
import expo.modules.imagepicker.exporters.ImageExporter
import expo.modules.imagepicker.exporters.RawImageExporter
import expo.modules.imagepicker.fileproviders.CacheFileProvider
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.kotlin.providers.ContextProvider

internal class MediaHandler(
  private val contextProvider: ContextProvider,
  private val appContextProvider: AppContextProvider,
) {
  /**
   * @return When there are multiple results return them as a [List] containing [ImagePickerMediaResponse]
   * but when there's a single result return it directly.
   */
  internal suspend fun readExtras(pickedMedias: List<Pair<MediaType, Uri>>, options: ImagePickerOptions): Any {
    val result = mutableListOf<ImagePickerMediaResponse>()

    for ((mediaType, uri) in pickedMedias) {
      result.add(when(mediaType) {
        MediaType.VIDEO -> handleVideo(uri)
        MediaType.IMAGE -> handleImage(uri, options)
      })
    }

    return if (result.size == 1) result[0] else result
  }

  private suspend fun handleImage(
    sourceUri: Uri,
    options: ImagePickerOptions,
  ): ImagePickerMediaResponse.Image {
    val exporter: ImageExporter = if (options.quality == ImagePickerConstants.MAXIMUM_QUALITY) {
      RawImageExporter(contextProvider)
    } else {
      CompressionImageExporter(appContextProvider, contextProvider, options.quality)
    }

    val outputFile = CacheFileProvider(
      contextProvider.context.cacheDir,
      getType(contextProvider.context.contentResolver, sourceUri).toFileExtension()
    ).generateFile()

    val exportedImage = exporter.exportAsync(sourceUri, outputFile)
    val base64 = options.base64.takeIf { it }
      ?.let { exportedImage.data() }
      ?.let { Base64.encodeToString(it.toByteArray(), Base64.NO_WRAP) }
    val exif = options.exif.takeIf { it }
      ?.let { exportedImage.exif() }

    return ImagePickerMediaResponse.Image(
      uri = Uri.fromFile(outputFile).toString(),
      width = exportedImage.width,
      height = exportedImage.height,
      base64 = base64,
      exif = exif,
    )
  }


  private suspend fun handleVideo(
    sourceUri: Uri,
  ): ImagePickerMediaResponse.Video {

    val outputFile = CacheFileProvider(contextProvider.context.cacheDir, ".mp4").generateFile()
    val metadataRetriever = MediaMetadataRetriever().apply {
      setDataSource(contextProvider.context, sourceUri)
    }

    copyFile(sourceUri, outputFile, contextProvider)

    return ImagePickerMediaResponse.Video(
      uri = Uri.fromFile(outputFile).toString(),
      width = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH),
      height = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT),
      duration = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_DURATION),
      rotation = metadataRetriever.extractInt(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION),
    )
  }
}
