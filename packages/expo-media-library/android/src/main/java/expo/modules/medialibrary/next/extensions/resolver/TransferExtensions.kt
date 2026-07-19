package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.net.Uri
import kotlin.io.copyTo

fun ContentResolver.copyUriContent(from: Uri, to: Uri) {
  openInputStream(from).use { input ->
    openOutputStream(to).use { output ->
      if (input != null && output != null) {
        input.copyTo(output)
      }
    }
  }
}
