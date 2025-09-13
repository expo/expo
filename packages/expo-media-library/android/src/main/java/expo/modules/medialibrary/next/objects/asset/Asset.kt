package expo.modules.medialibrary.next.objects.asset

import android.content.Context
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.delegates.AssetLegacyDelegate
import expo.modules.medialibrary.next.objects.asset.delegates.AssetModernDelegate
import expo.modules.medialibrary.next.objects.wrappers.MediaType
import expo.modules.medialibrary.next.objects.wrappers.MimeType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference
import kotlin.getValue

class Asset(contentUri: Uri, context: Context) : SharedObject() {
  private val contextRef = WeakReference(context)

  val assetDelegate by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      AssetModernDelegate(contentUri, contextRef.getOrThrow())
    } else {
      AssetLegacyDelegate(contentUri, contextRef.getOrThrow())
    }
  }

  val contentUri: Uri get() = assetDelegate.contentUri

  suspend fun getCreationTime(): Long? =
    assetDelegate.getCreationTime()

  suspend fun getDuration(): Long? =
    assetDelegate.getDuration()

  suspend fun getFilename(): String =
    assetDelegate.getFilename()

  suspend fun getHeight(): Int =
    assetDelegate.getHeight()

  suspend fun getWidth(): Int =
    assetDelegate.getWidth()

  suspend fun getMediaType(): MediaType =
    assetDelegate.getMediaType()

  suspend fun getModificationTime(): Long? =
    assetDelegate.getModificationTime()

  suspend fun getUri(): Uri =
    assetDelegate.getUri()

  suspend fun getMimeType(): MimeType =
    assetDelegate.getMimeType()

  suspend fun move(relativePath: RelativePath) = withContext(Dispatchers.IO) {
    assetDelegate.move(relativePath)
  }

  suspend fun copy(relativePath: RelativePath): Asset = withContext(Dispatchers.IO) {
    return@withContext assetDelegate.copy(relativePath)
  }

  suspend fun delete() = withContext(Dispatchers.IO) {
    assetDelegate.delete()
  }
}
