package expo.modules.medialibrary.next.objects.wrappers

import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import expo.modules.medialibrary.next.extensions.resolver.EXTERNAL_CONTENT_URI
import java.io.File

@JvmInline
value class MimeType(val value: String?) {
  init {
    require(value == null || value.matches(Regex("""^[\w-]+/([\w-]+)*$"""))) {
      "Invalid MIME type: $value"
    }
  }

  val type: String?
    get() = value?.substringBefore('/')
  val subType: String?
    get() = value?.substringAfter('/')

  fun isImage(): Boolean = type == "image"
  fun isVideo(): Boolean = type == "video"
  fun isAudio(): Boolean = type == "audio"

  fun assetRootDirectory(): String = when {
    value == null -> Environment.DIRECTORY_DCIM
    isImage() || isVideo() -> Environment.DIRECTORY_DCIM
    isAudio() -> Environment.DIRECTORY_MUSIC
    else -> Environment.DIRECTORY_DCIM
  }

  fun albumRootDirectory(): String = when {
    value == null -> Environment.DIRECTORY_PICTURES
    isImage() || isVideo() -> Environment.DIRECTORY_PICTURES
    isAudio() -> Environment.DIRECTORY_MUSIC
    else -> Environment.DIRECTORY_PICTURES
  }

  fun externalStorageAssetDirectory(): File =
    Environment.getExternalStoragePublicDirectory(assetRootDirectory())

  fun mediaCollectionUri(): Uri = when {
    value == null -> EXTERNAL_CONTENT_URI
    isImage() -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    isVideo() -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
    isAudio() -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    else -> EXTERNAL_CONTENT_URI
  }

  companion object {
    fun from(fileUri: Uri): MimeType {
      val extension = MimeTypeMap.getFileExtensionFromUrl(fileUri.toString())
        ?: return MimeType(null)
      val mimeTypeString = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
        ?: return MimeType(null)
      return MimeType(mimeTypeString)
    }
  }
}
