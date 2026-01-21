package expo.modules.medialibrary.next.objects.asset.factories

import android.net.Uri
import java.util.UUID

fun buildUniqueDisplayName(filePath: Uri): String {
  val fullFileName = filePath.lastPathSegment ?: "asset"
  val name = fullFileName.substringBeforeLast(".")
  val ext = fullFileName.substringAfterLast(".", "")
  val suffix = if (ext.isNotEmpty()) {
    ".$ext"
  } else {
    ""
  }
  val uniqueTag = UUID.randomUUID().toString().take(8)
  return "${name}_$uniqueTag$suffix"
}
