package expo.modules.medialibrary.next.objects.asset.factories

import android.net.Uri
import java.util.UUID

// The Content Resolver on Android can deal with non-unique display names
// by adding an order number (e.g., (1)) to the end of the displayName.
// However, without generating a unique display name,
// a race condition might occur and result in a "Failed to build unique file" exception.
fun buildUniqueDisplayName(filePath: Uri): String {
  val fullFileName = filePath.lastPathSegment ?: "asset"
  val nameWithoutExtension = fullFileName.substringBeforeLast(".")
  val extension = fullFileName.substringAfterLast(".", "")

  val suffix = if (extension.isNotEmpty()) {
    ".$extension"
  } else {
    ""
  }
  val uniqueId = UUID.randomUUID().toString().take(8)
  return "${nameWithoutExtension}_$uniqueId$suffix"
}
