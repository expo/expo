package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.net.Uri
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
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

fun ContentResolver.writeFileContentsToAsset(localFile: File, assetUri: Uri) {
  FileInputStream(localFile).channel.use { input ->
    (openOutputStream(assetUri) as FileOutputStream).use {
      it.channel.use { output ->
        val transferred = input.transferTo(0, input.size(), output)
        if (transferred != input.size()) {
          delete(assetUri, null, null)
          throw IOException("Could not save file to $assetUri Not enough space.")
        }
      }
    }
  }
}
