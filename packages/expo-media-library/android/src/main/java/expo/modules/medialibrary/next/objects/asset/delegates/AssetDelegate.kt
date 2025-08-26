package expo.modules.medialibrary.next.objects.asset.delegates

import android.net.Uri
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.wrappers.MimeType

interface AssetDelegate {
  val contentUri: Uri
  suspend fun getCreationTime(): Long?
  suspend fun getFilename(): String
  suspend fun getMimeType(): MimeType
  suspend fun getUri(): Uri
  suspend fun delete()
  suspend fun move(relativePath: RelativePath)
  suspend fun copy(relativePath: RelativePath): Asset
}
