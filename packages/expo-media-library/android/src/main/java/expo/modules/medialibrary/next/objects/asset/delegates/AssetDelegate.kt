package expo.modules.medialibrary.next.objects.asset.delegates

import android.net.Uri
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.objects.wrappers.MimeType

interface AssetDelegate {
  val contentUri: Uri
  suspend fun getCreationTime(): Long?
  suspend fun getDuration(): Long?
  suspend fun getFilename(): String
  suspend fun getHeight(): Int
  suspend fun getWidth(): Int
  suspend fun getMediaType(): MediaType
  suspend fun getModificationTime(): Long?
  suspend fun getUri(): Uri
  suspend fun getMimeType(): MimeType
  suspend fun delete()
  suspend fun move(relativePath: RelativePath)
  suspend fun copy(relativePath: RelativePath): Asset
}
