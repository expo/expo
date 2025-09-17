package expo.modules.medialibrary.next.objects.album

import android.content.Context
import expo.modules.medialibrary.next.exceptions.ContentResolverNotObtainedException
import expo.modules.medialibrary.next.extensions.getOrThrow
import expo.modules.medialibrary.next.extensions.resolver.queryAlbumId
import java.lang.ref.WeakReference

class AlbumQuery(context: Context) {
  private val contextRef = WeakReference(context)

  private val contentResolver
    get() = contextRef
      .getOrThrow()
      .contentResolver ?: throw ContentResolverNotObtainedException()

  suspend fun getAlbum(title: String): Album? {
    val id = contentResolver.queryAlbumId(title)
      ?: return null
    return Album(id, contextRef.getOrThrow())
  }
}

