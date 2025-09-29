package expo.modules.medialibrary.next.extensions

import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

suspend fun Context.scanFile(
  path: String,
  mimeType: String? = null
): Pair<String, Uri?> = suspendCoroutine { continuation ->
  MediaScannerConnection.scanFile(this, arrayOf(path), arrayOf(mimeType)) { path, uri ->
    continuation.resume(Pair(path, uri))
  }
}